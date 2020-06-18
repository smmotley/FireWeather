from django.shortcuts import render, redirect
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
from base64 import b64encode

MB_TOKEN = 'pk.eyJ1Ijoic21vdGxleSIsImEiOiJuZUVuMnBBIn0.xce7KmFLzFd9PZay3DjvAA'

@login_required(login_url='/login')
def fireDashboard(request):
    fire_data = FdfcFiles.objects.all()
    cal_fire_data = CAfire.objects.all()
    goes_images = GoesImages.objects.all()
    features = []
    #for fire in fire_data:
    for fire in cal_fire_data:
        feature = Feature(geometry=Point((fire.incident_longitude, fire.incident_latitude)),
                          properties=({"acres_burned": fire.incident_acres_burned,
                                       "fire_name": fire.incident_name,
                                       "fire_url": fire.incident_url}))
        features.append(feature)
    feature_collection = FeatureCollection(features)

    fire_data_json = json.dumps(feature_collection)
    for image in goes_images:
        fire_image = b64encode(image.fire_temp_image).decode("utf-8")


    fire_image = json.dumps(fire_image)

    # Note: Any item sent to javascript MUST be in json format as a string.
    return render(request=request,
                  template_name='goesFire/dashboard.html',
                  context={'mapbox_access_token': MB_TOKEN,
                           "fire_data": fire_data_json,
                           "goes_image": fire_image})


