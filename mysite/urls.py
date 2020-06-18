"""FireWeather URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path, include
import debug_toolbar
from . import views

app_name = "mysite"

urlpatterns = [
    path("", views.homepage, name="homepage"),
    path("register", views.register, name="registration"),
    path("logout", views.logout_request, name="logout"),
    path("login", views.login_request, name="login"),
    path("profile", views.update_profile, name="profile"),
    path("change_pw", views.change_password, name="change_password"),
    path("change_location", views.change_location, name="change_location"),
]
