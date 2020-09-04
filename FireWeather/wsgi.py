"""
WSGI config for FireWeather project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.0/howto/deployment/wsgi/
"""

import os, sys, platform

from django.core.wsgi import get_wsgi_application

if "Linux" in platform.platform(terse=True):
    sys.path.append("/var/www/FireWeather")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FireWeather.settings')

application = get_wsgi_application()
