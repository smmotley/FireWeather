from django.shortcuts import render, redirect
from django.db.models import Q, F
from django.core import serializers
from django.http import JsonResponse, HttpResponse
from django.db.models.expressions import RawSQL
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.db import transaction
from .models import CAfire, GoesImages, GoesFireTable, FdfcFiles, Profile
from geojson import Feature, Point, FeatureCollection
from django.contrib import messages
import numpy as np
import itertools
import json
from datetime import datetime, timedelta
import pytz
from base64 import b64encode

MB_TOKEN = 'pk.eyJ1Ijoic21vdGxleSIsImEiOiJuZUVuMnBBIn0.xce7KmFLzFd9PZay3DjvAA'

@login_required(login_url='/login')
def fireDashboard(request):
    fire_data = FdfcFiles.objects.all()
    cal_fire_data = CAfire.objects.filter(is_active='Y')

    # Ignore fire points that are more than 20 days old
    goes_fire_data = GoesFireTable.objects.filter(Q(scan_dt__gte=(datetime.utcnow() - timedelta(days=20))))

    # Get the latest Goes Image.
    goes_images = GoesImages.objects.all()

    # List for all the features
    features = []

    # List for all GeoJson GOES Data for javascript
    goes_features = []

    # This will allow the "Current Fires Tab" on the dashboard to only display fire groups, rather than individual
    # values for every point
    unique_fire_ids = []

    # The javascript needs every single point, but our table only needs one point from the fire group.
    unique_goes_features =[]

    # Build the Cal Fire GeoJson
    for fire in cal_fire_data:
        # Start building the geojson feature for the Cal
        feature = Feature(geometry=Point((fire.incident_longitude, fire.incident_latitude)),
                          properties=({"acres_burned": fire.incident_acres_burned,
                                       "fire_name": fire.incident_name,
                                       "fire_url": fire.incident_url}))
        features.append(feature)

    feature_collection = FeatureCollection(features)

    # Cal Fire geojson feature list.
    fire_data_json = json.dumps(feature_collection)

    # Build the GOES-17 GeoJson file.
    for pixel in goes_fire_data:
        # Fill in empty values in case data are missing for this point.
        time_diff = None
        pixel_time = None
        dist = None
        fire_size = None
        source = "GOES Satellite"

        # Get the time elapsed from the time of the GOES-17 Scan
        if pixel.scan_dt:
            time_delt = (datetime.now(tz=pytz.UTC)-pixel.scan_dt)
            time_diff = int(time_delt.total_seconds()/(60*60))      # Hours
            pixel_time = (pixel.scan_dt).strftime("%m/%d %H:%M")

        # Only one user (the user currently hitting this program), so this just get first item [0] from the query set.
        dist_to_user = Profile.objects\
            .with_distance(latitude=pixel.lat, longitude=pixel.lng, units="miles") \
            .filter(user=request.user)[0]

        # Populate the HTML popup window. Assume CalFire has not ID'ed this fire.
        cal_fire_pixel_info = ""

        # Pixel has a CA Fire ID, so fill the popup with the appropriate HTML
        if pixel.cal_fire_incident_id:
            incident_id = pixel.cal_fire_incident_id
            cal_fire_pixel = CAfire.objects.get(incident_id=incident_id)
            fire_size = cal_fire_pixel.incident_acres_burned
            cal_fire_pixel_info = f"<b><u>CalFire has ID'ed this fire:<br></u>" \
                                   f"Fire Name:</b> {cal_fire_pixel.incident_name}<br>" \
                                   f"<b>Acres Burned:</b> {cal_fire_pixel.incident_acres_burned}<br>" \
                                   f"<b>Additional Info: <u><a href=\"{cal_fire_pixel.incident_url}\">" \
                                    "Cal Fire Incident Page</a></u>"
            source = "CAL Fire & Satellite"

        else:
            # No Cal Fire ID yet, so find an approximate fire size.
            pixels_in_group = GoesFireTable.objects.filter(fire_id=pixel.fire_id).count()

            # Each pixel is 2km. 1 square km = 247.105 acres.
            fire_size = int(2 * pixels_in_group * 247.105)

        # If the user has information stored for their current location, find the distance to them.
        if dist_to_user.distance_to_user:
            dist = int(dist_to_user.distance_to_user)

        # Fill the GeoJson feature information in for each goes pixel.
        goes_feature = Feature(geometry=Point((pixel.lng, pixel.lat)),
                               properties=({"fire_id": pixel.fire_id,
                                            "source": source,
                                            "scan_dt": time_diff,
                                            "pretty_time": pixel_time,
                                            "spread_rate": "Moderate",
                                            "distance_to_user": dist,
                                            "fire_size": fire_size,
                                            "lat": pixel.lat,
                                            "lng": pixel.lng,
                                            "description": f"<i class=\"tiny material-icons\">rss_feed</i>"
                                                           f"<b><u>Satellite Detected Fire</b></u><br>"
                                                           f"<b>Satellite Obs Time: </b>{pixel_time}<br>"
                                                           f"<b>Fire Group: </b>{pixel.fire_id}<br>"
                                                           f"<b>Age in Hrs: </b>{time_diff}<br>",
                                            "cal_fire_info": cal_fire_pixel_info
                                           }))

        goes_features.append(goes_feature)

        # For unique values only, append the same goes_feature data above. This prevents the table on the
        # "Current Fires" list from populating every single fire point (instead it just shows the fire group).
        if pixel.fire_id not in unique_fire_ids:
            unique_goes_features.append(goes_feature)
            unique_fire_ids.append(pixel.fire_id)

    goes_feature_collection = FeatureCollection(goes_features)
    unique_goes_feature_collection = FeatureCollection(unique_goes_features)

    goes_fire_pixels = json.dumps(goes_feature_collection)

    for image in goes_images:
        if image.fire_temp_image is not None:
            fire_image = b64encode(image.fire_temp_image).decode("utf-8")
        else:
            fire_image = None


    fire_image = json.dumps(fire_image)

    # Note: Any item sent to javascript MUST be in json format as a string.
    return render(request=request,
                  template_name='goesFire/dashboard.html',
                  context={'mapbox_access_token': MB_TOKEN,
                           "fire_data": fire_data_json,
                           "goes_image": fire_image,
                           "goes_fire_pixels": goes_fire_pixels,
                           "goes_template_data": unique_goes_feature_collection})


