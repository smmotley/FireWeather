import os
from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib.auth.forms import AuthenticationForm, PasswordChangeForm
from django.contrib.auth.models import User
from django.contrib.auth import logout, login, authenticate, update_session_auth_hash
from django.contrib import messages
from mysite.forms import NewUserForm, EditUserForm, UserLocationForm
from .forms import UserProfileForm
from goesFire.models import Profile, Alert
from django.db import transaction
from django.contrib.auth.decorators import login_required
from django.core import serializers
from geojson import Feature, Point, FeatureCollection
import json

MB_TOKEN = os.environ['MB_TOKEN']

def homepage(request):
    return render(request=request,
                  template_name="mysite/homepage.html",
                  context={})

# Since people are actually using POST requests when the register
def register(request):
    if request.method == "POST":
        form = NewUserForm(request.POST)  # So if we're hitting this with a POST method, then our form is populated.
        if form.is_valid():
            user = form.save()  # This is saying, we are now creating a user and saving the data to the database
            username = form.cleaned_data.get('username')
            messages.success(request, f"New Account Created: {username}") #NOTE: f-string: we are now passing the variable {username} to the homepage
            messages.success(request, f"You are now logged in as: {username}")
            login(request, user)  # Now that the user is created, we need to log them in
            # Redirect them to any page ("") will redirect them to the homepage
            # "main:homepage" goes into urls.py, looks for the app_name="main" and
            # then finds the link associated with name="homepage"
            return redirect("mysite:homepage")
        else:
            for msg in form.error_messages:
                messages.error(request, f"{msg}:{form.error_messages}")

    form = NewUserForm
    return render(request=request,
                  template_name='mysite/register.html',
                  context={"form": form})


def logout_request(request):
    logout(request)
    messages.info(request, "Logged out successfully!")
    return redirect("mysite:homepage")


def login_request(request):
    form = AuthenticationForm()
    #IF this is a POST request, that means someone hit the SUBMIT button and we are accessing this def with data
    if request.method == "POST":
        form = AuthenticationForm(request, data=request.POST) # So if we're hitting this with a POST method, then our form is populated.
        if form.is_valid():
            username = form.cleaned_data.get('username')  # 'username' is the field name
            password = form.cleaned_data.get('password')  # 'password' is the field name
            user = authenticate(username=username, password=password)
            if user is not None:
                # Note: user is parameter in the login module that will be passed in the context of the the redirect page
                # (that way you can access things like {user.username}
                login(request, user=user)
                messages.success(request, f"You are now logged in as: {username}") #NOTE: f-string: we are now passing the variable {username} to the homepage
                # Redirect them to any page ("") will redirect them to the homepage
                # "main:homepage" goes into urls.py, looks for the app_name="main" and
                # then finds the link associated with name="homepage"
                return redirect("goesFire:dashboard")
            else:
                messages.error(request, "Invalid username or password")
        else:
            messages.error(request, "Invalid username or password")
    form = AuthenticationForm()
    return render(request,
                  "mysite/login.html",
                  {"form": form})

@login_required
@transaction.atomic
def update_profile(request):
    if request.method == 'POST':
        profile_form = UserProfileForm(request.POST, instance=request.user.profile)
        user_form = EditUserForm(request.POST, instance=request.user)
        if profile_form.is_valid() and user_form.is_valid():
            profile_form.save()
            user_form.save()
            messages.success(request, f"Your Account Has Been Updated")
            return redirect('goesFire:dashboard')
        else:
            for msg in profile_form.error_messages:
                messages.error(request, f"{msg}:{profile_form.error_messages}")
    else:
        user_form = EditUserForm(instance=request.user)
        profile_form = UserProfileForm(instance=request.user.profile)
    return render(request=request,
                  template_name='mysite/account/account_general.html',
                  context={
                    'user_form': user_form,
                    'profile_form': profile_form
                   })


@login_required
def change_password(request):
    if request.method == 'POST':
        pw_form = PasswordChangeForm(data=request.POST, user=request.user)
        if pw_form.is_valid():
            pw_form.save()
            update_session_auth_hash(request, pw_form.user)
            messages.success(request, f"Your Account Has Been Updated")
            return redirect('goesFire:dashboard')
        else:
            for msg in pw_form.error_messages:
                messages.error(request, f"{msg}:{pw_form.error_messages}")
            return redirect('mysite:change_password')

    else:
        pw_form = PasswordChangeForm(user=request.user)
        args = ({'pw_form' : pw_form})
        return render(request= request, template_name='mysite/account/change_password.html', context=args)


@login_required
@transaction.atomic
def change_location(request):
    MB_TOKEN = 'pk.eyJ1Ijoic21vdGxleSIsImEiOiJuZUVuMnBBIn0.xce7KmFLzFd9PZay3DjvAA'
    profile_obj = Profile.objects.filter(user=request.user)
    geojson_locations = create_markers(profile_obj[0])
    if request.method == 'POST':
        location_form = UserLocationForm(request.POST, instance=request.user.profile)
        #user_form = EditUserForm(request.POST, instance=request.user)
        #if location_form.is_valid() and user_form.is_valid():
        if location_form.is_valid():
            location_form.save()
            #user_form.save()
            messages.success(request, f"Your Account Has Been Updated")
            return redirect('goesFire:dashboard')
        else:
            for msg in location_form.error_messages:
                messages.error(request, f"{msg}:{location_form.error_messages}")
            return redirect('mysite:change_location')
    else:
        #user_form = EditUserForm(instance=request.user)
        location_form = UserLocationForm(instance=request.user.profile)

    # json strings needed for javascript whereas json is needed for the template.
    feature_collection = json.dumps(geojson_locations)
    profile_obj_json = serializers.serialize("json", profile_obj)

    return render(request=request,
                  template_name='mysite/account/change_location.html',
                  context={
                    'profile_obj': profile_obj_json,
                    'location_data': feature_collection,
                    'location_template': geojson_locations,
                    'location_form': location_form,
                    'mapbox_access_token': MB_TOKEN,
                   })

def create_markers(data):
    features = []
    # for fire in fire_data:
    if data.user_lat:
        user_feature = Feature(geometry=Point((data.user_lng, data.user_lat)),
                          properties=({"description": 'Current Location',
                                       "radius": data.user_radius,
                                       "id": 'fav0',
                                       "alert": None,
                                       "type": "text"
                                       }))
        features.append(user_feature)
    else:
        user_feature = Feature(geometry=Point(),
                               properties=({"description": 'Current Location',
                                            "radius": data.user_radius,
                                            "id": 'fav0',
                                            "alert": None,
                                            "type": "text"
                                            }))
        features.append(user_feature)

    if data.fav1_lat:
        user_feature = Feature(geometry=Point((data.fav1_lng, data.fav1_lat)),
                               properties=({"description": data.fav1_desc,
                                            "radius": data.fav1_radius,
                                            "id": 'fav1',
                                            "alert": None,
                                            "type": "text"
                                            }))
        features.append(user_feature)
    else:
        user_feature = Feature(geometry=Point(),
                               properties=({"description": "fav1",
                                            "radius": data.fav1_radius,
                                            "id": 'fav1',
                                            "alert": None,
                                            "type": "hidden"
                                            }))

        features.append(user_feature)

    if data.fav2_lat:
        user_feature = Feature(geometry=Point((data.fav2_lng, data.fav2_lat)),
                               properties=({"description": data.fav2_desc,
                                            "radius": data.fav2_radius,
                                            "id": 'fav2',
                                            "alert": None,
                                            "type": "text"
                                            }))
        features.append(user_feature)
    else:
        user_feature = Feature(geometry=Point(),
                               properties=({"description": "fav2",
                                            "radius": data.fav2_radius,
                                            "id": 'fav2',
                                            "alert": None,
                                            "type": "hidden"
                                            }))
        features.append(user_feature)

    feature_collection = FeatureCollection(features)

    return feature_collection
