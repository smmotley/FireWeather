from django.shortcuts import render, redirect
from django.db.models import Q
from django.core import serializers
from django.http import JsonResponse, HttpResponse
from django.db.models.expressions import RawSQL
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.db import transaction
from .models import CAfire, GoesImages, GoesFireTable, FdfcFiles
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
    goes_images = GoesImages.objects.all()
    features = []
    goes_features =[]
    #for fire in fire_data:
    for fire in cal_fire_data:
        feature = Feature(geometry=Point((fire.incident_longitude, fire.incident_latitude)),
                          properties=({"acres_burned": fire.incident_acres_burned,
                                       "fire_name": fire.incident_name,
                                       "fire_url": fire.incident_url}))
        features.append(feature)
    feature_collection = FeatureCollection(features)

    fire_data_json = json.dumps(feature_collection)

    for pixel in goes_fire_data:
        time_diff = None
        pixel_time = None
        if pixel.scan_dt:
            time_delt = (datetime.now(tz=pytz.UTC)-pixel.scan_dt)
            time_diff = time_delt.days*24
            pixel_time = (pixel.scan_dt).strftime("%m/%d %H:%M")

        cal_fire_pixel_info = ""
        if pixel.cal_fire_incident_id:
            cal_fire_pixel = CAfire.objects.filter(incident_id=pixel.cal_fire_incident_id)
            cal_fire_pixel_info = f"<b>This fire has been identified by CalFire:<br>" \
                                   f"Fire Name: {cal_fire_pixel['incident_name']}<br>" \
                                   f"Acres Burned: {cal_fire_pixel['incident_acres_burned']}" \
                                   f"Additional Info: {cal_fire_pixel['incident_url']}"

        goes_feature = Feature(geometry=Point((pixel.lng, pixel.lat)),
                               properties=({"fire_id": pixel.fire_id,
                                            "type": "goes_pixel",
                                            "scan_dt": time_diff,
                                            "description": f"<b>Satellite Detected Fire</b><br>"
                                                           f"<b>Obs Time: </b>{pixel_time}<br>"
                                                           f"<b>Fire Group: </b>{pixel.fire_id}<br>",
                                            "cal_fire_info": cal_fire_pixel_info
                                           }))

        goes_features.append(goes_feature)
    goes_feature_collection = FeatureCollection(goes_features)

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
                           "goes_fire_pixels": goes_fire_pixels})


