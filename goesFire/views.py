from django.shortcuts import render, redirect
from django.db.models import Q, F
from django.core import serializers
from django.http import JsonResponse, HttpResponse
from django.db.models.expressions import RawSQL
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.db import transaction
from .models import CAfire, GoesImages, GoesFireTable, FdfcFiles, Profile, Alert
from geojson import Feature, Point, FeatureCollection
from django.contrib import messages
import numpy as np
import itertools
import json
from datetime import datetime, timedelta
import pytz
import math
from base64 import b64encode

MB_TOKEN = 'pk.eyJ1Ijoic21vdGxleSIsImEiOiJuZUVuMnBBIn0.xce7KmFLzFd9PZay3DjvAA'

@login_required(login_url='/login')
def fireDashboard(request):
    fire_data = FdfcFiles.objects.all()
    user_info = Profile.objects.filter(user=request.user)[0]
    user_lat = user_info.user_lat
    user_lng = user_info.user_lng

    # FORCE EVALUATE so that the database is only hit once.
    # See https://docs.djangoproject.com/en/dev/ref/models/querysets/#when-querysets-are-evaluated
    active_CALFires = list(CAfire.objects.filter(is_active='Y'))

    # FORCE EVALUATE
    cal_fire_data = list(CAfire.objects.all())
    #active_CALFires = [fire for fire in cal_fire_data if fire.is_active == 'Y']

    # Ignore fire points that are more than 10 days old
    goes_fire_data = list(GoesFireTable.objects.filter(Q(scan_dt__gte=(datetime.utcnow() - timedelta(days=10)))))

    # Show New Fire
    new_fires = list(Alert.objects.values_list('fire_id',flat=True).filter(user=request.user, seen_on_website=False))

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
    for fire in active_CALFires:
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
        new_to_user = 0
        source = "GOES Satellite"

        # Get the time elapsed from the time of the GOES-17 Scan
        if pixel.scan_dt:
            time_delt = (datetime.now(tz=pytz.UTC)-pixel.scan_dt)
            time_diff = int(time_delt.total_seconds()/(60*60))      # Hours
            pixel_time = (pixel.scan_dt).strftime("%m/%d %H:%M")

        # Only one user (the user currently hitting this program), so this just get first item [0] from the query set.
        dist_to_user = distance(user_lat, user_lng, pixel.lat, pixel.lng)

        # Populate the HTML popup window. Assume CalFire has not ID'ed this fire.
        cal_fire_pixel_info = ""

        # Pixel has a CA Fire ID, so fill the popup with the appropriate HTML
        if pixel.cal_fire_incident_id:
            incident_id = pixel.cal_fire_incident_id
            # For some reason, Cal Fire may change their incident IDs. This could cause an error because the GOES
            # database would have the old CalFire ID associated with a fire pixel.
            try:
                cal_fire_pixel = [fire for fire in cal_fire_data if fire.incident_id == incident_id][0]
                fire_size = cal_fire_pixel.incident_acres_burned
                cal_fire_pixel_info = f"<b><u>CalFire has ID'ed this fire:<br></u>" \
                                      f"Fire Name:</b> {cal_fire_pixel.incident_name}<br>" \
                                      f"<b>Acres Burned:</b> {cal_fire_pixel.incident_acres_burned}<br>" \
                                      f"<b>Additional Info: <u><a href=\"{cal_fire_pixel.incident_url}\" " \
                                      f"target=\"_blank\">" "Cal Fire Incident Page</a></u>"
                source = "CAL Fire & Satellite"
            except IndexError:
                cal_fire_pixel_info = f"<b><u>CalFire has ID'ed this fire:<br></u>" \
                                      "However, CalFire has an error with the ID of the fire<br>"
                source = "CAL Fire & Satellite"
                print(f"Cal Fire Id {incident_id} not found in CalFire's current database.")
                print(IndexError)
        else:
            # No Cal Fire ID yet, so find an approximate fire size.
            #     NOTE: filtering off of the object causes a hit to the DB every time. Doing so causes a
            #     significant performance hit. Do list comprehension instead, on the list, to avoid the hit to the DB.
            #     e.g. DONT DO THIS: pixels_in_group = GoesFireTable.objects.filter(fire_id=pixel.fire_id).count()
            try:
                pixels_in_group = len([px for px in goes_fire_data if px.fire_id == pixel.fire_id])

                # Each pixel is 2km. 1 square km = 247.105 acres. However, it is highly unlikely that the
                # fire is covering the entire pixel (off by as much as a factor of 10).
                # Will divide by 5 to be safe.
                fire_size = int(2 * pixels_in_group * 247.105/5)
            except ValueError as e:
                print(f"An Error occurred when trying to est fire size {e}")

        # If the user has information stored for their current location, find the distance to them.
        if dist_to_user:
            dist = int(dist_to_user)

        # The user hasn't seen this fire via the website. This will add an "unread" icon on the "Current Fires" tab
        if pixel.fire_id in new_fires:
            new_to_user = 1

        # Fill the GeoJson feature information in for each goes pixel.
        goes_feature = Feature(geometry=Point((pixel.lng, pixel.lat)),
                               properties=({"fire_id": pixel.fire_id,
                                            "source": source,
                                            "scan_dt": time_diff,
                                            "pretty_time": pixel_time,
                                            "spread_rate": "Moderate",
                                            "distance_to_user": dist,
                                            "new_to_user": new_to_user,
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

    # Reset all values for seen_on_website to True.
    Alert.objects.filter(user=request.user).update(seen_on_website=True)
    # Note: Any item sent to javascript MUST be in json format as a string.
    return render(request=request,
                  template_name='goesFire/dashboard.html',
                  context={'mapbox_access_token': MB_TOKEN,
                           "new_fire_count": len(new_fires),
                           "fire_data": fire_data_json,
                           "goes_image": fire_image,
                           "goes_fire_pixels": goes_fire_pixels,
                           "goes_template_data": unique_goes_feature_collection})


@login_required(login_url='/login')
def unreadfires(request):
    # This is a very simple update to the database where the user will click on a fire in the "Current Fires"
    # tab, and the fire will now register as a "viewed" fire. (Similar to the way unread mail works).
    try:
        if request.method == 'GET':
            read_fire = Alert.objects.get(user=request.user, fire_id=request.GET['fire_id'])
            read_fire.seen_on_website = True
            read_fire.save()
        return
    except:
        return


@login_required(login_url='/login')
def getSatImgs(request):
    # Get the latest Goes Image.
    sat_imgs = []
    if request.method == 'GET':
        goes_images = GoesImages.objects.filter(Q(scan_dt__gte=(datetime.utcnow() - timedelta(days=6))))
        for image in goes_images:
            if image.fire_temp_image is not None:
                sat_imgs.append(b64encode(image.fire_temp_image).decode("utf-8"))
            else:
                fire_image = None

    return JsonResponse({'sat_imgs':sat_imgs})



def distance(user_lat, user_lng, pixel_lat, pixel_lng):
    radlat = math.radians(pixel_lat)  # given latitude
    radlong = math.radians(pixel_lng)  # given longitude
    radflat = math.radians(user_lat)  # model (i.e. database) 'lat' parameter
    radflong = math.radians(user_lng)  # model (i.e. database) 'lng' parameter
    earthRad = 3959.0
    # Note 3959.0 is for miles. Use 6371 for kilometers
    Expression = earthRad * math.acos(math.cos(radlat) * math.cos(radflat) *
                                 math.cos(radflong - radlong) +
                                 math.sin(radlat) * math.sin(radflat))

    return Expression


