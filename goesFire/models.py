from django.db import models
from django.contrib.gis.db import models as geomodels
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.validators import RegexValidator
from phonenumber_field.modelfields import PhoneNumberField
from django.contrib.gis.geos import Point
from django.db.models import Func, F
from datetime import datetime
import math

# This class allows for distance calculations from a Point on our goesR_Fire.py program.
# We could use POSTgis too, but this is easier to understand.
class WithDistanceManager(models.Manager):
    def fire_pixel_dist(self, longitude, latitude):
        """
               Modified From: https://gist.github.com/rchrd2/5e0b014640a459a14ef038975d2a3683
               Returns a QuerySet of locations annotated with their distance from the
               given point. This can then be filtered.
               Usage:
                   Foo.objects.with_distance(lat, lon, fav#).filter(distance__lt=10).count()
               @see http://stackoverflow.com/a/31715920/1373318
               :param latitude (float):    The latitude of the fire (e.g. 38.01)
               :param longitude (float):   The longitude of the fire (e.g. -120.22)
               """

        class Sin(Func):
            function = 'SIN'

        class Cos(Func):
            function = 'COS'

        class Acos(Func):
            function = 'ACOS'

        class Radians(Func):
            function = 'RADIANS'

        radlat = Radians(latitude)      # given latitude
        radlong = Radians(longitude)    # given longitude
        radflat = Radians(F('lat'))     # model (i.e. database) 'lat' parameter
        radflong = Radians(F('lng'))    # model (i.e. database) 'lng' parameter

        earthRad = 3959.0

        # Note 3959.0 is for miles. Use 6371 for kilometers
        Expression = earthRad * Acos(Cos(radlat) * Cos(radflat) *
                                          Cos(radflong - radlong) +
                                          Sin(radlat) * Sin(radflat))

        return self.get_queryset().annotate(distance=Expression)

    def with_distance(self, longitude, latitude, units):
        """
        Modified From: https://gist.github.com/rchrd2/5e0b014640a459a14ef038975d2a3683
        Returns a QuerySet of locations annotated with their distance from the
        given point. This can then be filtered.
        Usage:
            Foo.objects.with_distance(lat, lon, fav#).filter(distance__lt=10).count()
        @see http://stackoverflow.com/a/31715920/1373318
        :param latitude (float):    The latitude of the fire (e.g. 38.01)
        :param longitude (float):   The longitude of the fire (e.g. -120.22)
        :param fav (string):        The label for the saved location (e.g. "user_", "fav1_", "fav2_"
        """
        class Sin(Func):
            function = 'SIN'
        class Cos(Func):
            function = 'COS'
        class Acos(Func):
            function = 'ACOS'
        class Radians(Func):
            function = 'RADIANS'

        radlat = Radians(latitude) # given latitude
        radlong = Radians(longitude) # given longitude

        shortest_dist = None
        radflat_user = Radians(F('user_lat'))
        radflong_user = Radians(F('user_lng'))

        radflat_fav1 = Radians(F('fav1_lat'))
        radflong_fav1 = Radians(F('fav1_lng'))

        radflat_fav2 = Radians(F('fav2_lat'))
        radflong_fav2 = Radians(F('fav2_lng'))

        if units == 'km' or "kilometers":
            earthRad = 6371.0
        else:
            earthRad = 3959.0


        # Note 3959.0 is for miles. Use 6371 for kilometers
        Expression_user = earthRad * Acos(Cos(radlat) * Cos(radflat_user) *
                                   Cos(radflong_user - radlong) +
                                   Sin(radlat) * Sin(radflat_user))

        Expression_fav1 = earthRad * Acos(Cos(radlat) * Cos(radflat_fav1) *
                                          Cos(radflong_fav1 - radlong) +
                                          Sin(radlat) * Sin(radflat_fav1))

        Expression_fav2 = earthRad * Acos(Cos(radlat) * Cos(radflat_fav2) *
                                          Cos(radflong_fav2 - radlong) +
                                          Sin(radlat) * Sin(radflat_fav2))

        return self.get_queryset().annotate(distance_to_user=Expression_user,
                                            distance_to_fav1=Expression_fav1,
                                            distance_to_fav2=Expression_fav2)


# A table to hold all the profile information of every user.
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    #id = models.IntegerField(primary_key=True)
    alert_ok_time_start = models.DateTimeField(null=True, blank=True)
    alert_ok_time_end = models.DateTimeField(null=True, blank=True)
    user_lat = models.FloatField(null=True, blank=True)
    user_lng = models.FloatField(null=True, blank=True)
    fav1_lat = models.FloatField(null=True, blank=True)
    fav1_lng = models.FloatField(null=True, blank=True)
    fav2_lat = models.FloatField(null=True, blank=True)
    fav2_lng = models.FloatField(null=True, blank=True)
    fav1_desc = models.CharField(max_length=30, null=True, blank=True)
    fav2_desc = models.CharField(max_length=30, null=True, blank=True)
    user_radius = models.IntegerField(null=True, blank=True, default=50)
    fav1_radius = models.IntegerField(null=True, blank=True, default=50)
    fav2_radius = models.IntegerField(null=True, blank=True, default=50)
    last_alert = models.DateTimeField(null=True, blank=True)
    calfire_incident_id = models.TextField(null=True, blank=True)
    #need_to_alert = models.IntegerField(null=True, blank=True)
    dist_to_fire = models.FloatField(null=True, blank=True)
    alert_time = models.FloatField(null=True, blank=True)
    fire_lat = models.FloatField(null=True, blank=True)
    fire_lng = models.FloatField(null=True, blank=True)
    phone_number = PhoneNumberField(blank=True, null=True)
    objects = WithDistanceManager()

    def __str__(self):
        return f'{self.user.first_name}'


# Whenever there is a post_save in the User model, run the following code
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()


# A table generated by pandas to hold all the CAL fire data. The table is dropped and recreated on EVERY data pull.
class CAfire(models.Model):
    id = models.IntegerField(primary_key=True)
    incident_id = models.CharField(max_length=200,null=True, blank=True)
    incident_name = models.TextField(null=True, blank=True)
    incident_is_final = models.IntegerField(null=True, blank=True)
    incident_date_last_update = models.TextField(null=True, blank=True)
    incident_date_created = models.TextField(null=True, blank=True)
    incident_administrative_unit = models.TextField(null=True, blank=True)
    incident_county = models.TextField(null=True, blank=True)
    incident_location = models.TextField(null=True, blank=True)
    incident_acres_burned = models.IntegerField(null=True, blank=True)
    incident_containment = models.IntegerField(null=True, blank=True)
    incident_control = models.TextField(null=True, blank=True)
    incident_cooperating_agencies = models.TextField(null=True, blank=True)
    incident_longitude = models.FloatField(null=True, blank=True)
    incident_latitude = models.FloatField(null=True, blank=True)
    incident_type = models.TextField(null=True, blank=True)
    incident_url = models.TextField(null=True, blank=True)
    incident_date_extinguished = models.TextField(null=True, blank=True)
    incident_dateonly_extinguished = models.TextField(null=True, blank=True)
    incident_dateonly_created = models.TextField(null=True, blank=True)
    is_active = models.CharField(null=True, blank=True, max_length=20)

    @classmethod
    def calFire_info(cls, id):
        return cls.objects.filter(incident_id=id).first()

    #class Meta:
        #db_table = "cal_fire"


# Image Table to hold the actual .PNG images
class GoesImages(models.Model):
    id = models.IntegerField(primary_key=True)
    scan_dt = models.DateTimeField(null=True)
    fire_temp_image = models.BinaryField(null=True)
    fire_temp_gif = models.BinaryField(null=True)
    s3_filename = models.TextField(null=True)
    fire_id = models.TextField(null=True)


# A table of every lat/lng hot-spot detected by the GOES satellite. Every point will have a fire_id associated with it.
# If the point is close to an known cal-fire, the cal_fire_incident_id will be changed from NULL to whatever the ID is.
class GoesFireTable(models.Model, WithDistanceManager):
    id = models.IntegerField(primary_key=True)
    cal_fire_incident_id = models.TextField(null=True)
    lat = models.FloatField()
    lng = models.FloatField()
    scan_dt = models.DateTimeField(null=True)
    s3_filename = models.TextField(null=True)
    fire_id = models.IntegerField(null=True)
    objects = WithDistanceManager()

    class Meta:
        unique_together = ('lat', 'lng', 'scan_dt')

# A table to hold all of the file names already downloaded.
class FdfcFiles(models.Model):
    id = models.IntegerField(primary_key=True)
    s3_filename_fdfc = models.TextField(null=True)
    s3_filename_multiband = models.TextField()
    new_fires = models.IntegerField(null=True)
    scan_dt_fdfc = models.DateTimeField(null=True)
    scan_dt_multiband = models.DateTimeField(null=True)


class Alert(models.Model):
    user = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)
    fire_id = models.ForeignKey(GoesFireTable, null=True, on_delete=models.SET_NULL)
    dist_to_fire = models.FloatField(null=True)
    alert_time = models.DateTimeField(null=True)
    need_to_alert = models.BooleanField(null=True)
    cal_fire_incident_id = models.CharField(max_length=200,null=True, blank=True)
    closest_saved_location = models.CharField(max_length=200,null=True, blank=True)

    def distance_to_fire(self):
        """
                Modified From: https://gist.github.com/rchrd2/5e0b014640a459a14ef038975d2a3683
                Returns a QuerySet of locations annotated with their distance from the
                given point. This can then be filtered.
                Usage:
                    Foo.objects.with_distance(lat, lon, fav#).filter(distance__lt=10).count()
                @see http://stackoverflow.com/a/31715920/1373318
                :param latitude (float):    The latitude of the fire (e.g. 38.01)
                :param longitude (float):   The longitude of the fire (e.g. -120.22)
                :param fav (string):        The label for the saved location (e.g. "user_", "fav1_", "fav2_"
                """
        units = 'miles'
        if units == 'km' or "kilometers":
            earthRad = 6371.0
        else:
            earthRad = 3959.0

        # There are two cases we're trying to capture here:
        # Case 1) fire_id has a value: This is a GOES detected fire that has a latlng provided by the
        #           satellite image (whether CalFire has IDed the fire is irrelevant because we don't
        #           need that info for these calcs).
        # Case 2) fire_id is None and CalFire has a value: This is a CalFire that does not have a fire_id,
        #         thus it was not detected by GOES-R. Most importantly if this was not detected by GOES-R,
        #         it's not in our goesfiretable and will not have any latlng info. So, in case 2, fire_id = None
        if self.fire_id is not None:
            radlat = math.radians(self.fire_id.lat)  # given latitude
            radlong = math.radians(self.fire_id.lng)  # given longitude
        elif self.cal_fire_incident_id is not None:
            radlat = math.radians(self.calFire.incident_latitude)  # given latitude
            radlong = math.radians(self.calFire.incident_longitude)  # given longitude

        loc = None
        alert = False
        closest_location = 999999999  # Some arbitratily large number

        # If the user has a current position saved, find the distance from the fire to that point.
        if self.user.profile.user_lat is not None and self.user.profile.user_lng is not None:
            radflat_user = math.radians(self.user.profile.user_lat)
            radflong_user = math.radians(self.user.profile.user_lng)
            # Note 3959.0 is for miles. Use 6371 for kilometers
            user_dist = earthRad * math.acos(math.cos(radlat) * math.cos(radflat_user) *
                                             math.cos(radflong_user - radlong) +
                                             math.sin(radlat) * math.sin(radflat_user))
            if user_dist < self.user.profile.user_radius:
                alert = True
                loc = "Current Position"
                # Start off assuming this saved position is the closest.
                closest_location = user_dist

        # If the user has a fav1 position saved, find the distance from the fire to that point.
        if self.user.profile.fav1_lat is not None and self.user.profile.fav1_lng is not None:
            radflat_fav1 = math.radians(self.user.profile.fav1_lat)
            radflong_fav1 = math.radians(self.user.profile.fav1_lng)
            fav1_dist = earthRad * math.acos(math.cos(radlat) * math.cos(radflat_fav1) *
                                             math.cos(radflong_fav1 - radlong) +
                                             math.sin(radlat) * math.sin(radflat_fav1))
            if fav1_dist < self.user.profile.fav1_radius:
                alert = True
                # Test if this is now the closest location to the point
                if fav1_dist < closest_location:
                    closest_location = fav1_dist
                    loc = self.user.profile.fav1_desc

        # If the user has a fav2 position saved, find the distance from the fire to that point.
        if self.user.profile.fav2_lat is not None and self.user.profile.fav2_lng is not None:
            radflat_fav2 = math.radians(self.user.profile.fav2_lat)
            radflong_fav2 = math.radians(self.user.profile.fav2_lng)
            fav2_dist = earthRad * math.acos(math.cos(radlat) * math.cos(radflat_fav2) *
                                             math.cos(radflong_fav2 - radlong) +
                                             math.sin(radlat) * math.sin(radflat_fav2))

            if fav2_dist < self.user.profile.fav2_radius:
                alert = True
                # Test if this is now the closest location to the point
                if fav2_dist < closest_location:
                    loc = self.user.profile.fav2_desc
                    closest_location = fav2_dist

        return alert, closest_location, loc

    def save(self, *args, **kwargs):
        # In most cases, we will not have a CalFire ID because the GOES-R will ID the fire first. However, if
        # we do have a CalFire ID associated with this, then go ahead and grab all the CalFire information associated
        # with that ID from the "CAfire" class object.
        if self.cal_fire_incident_id is not None:
            self.calFire = CAfire.calFire_info(self.cal_fire_incident_id)

        # The else case is basically going to give it a value of None.
        else:
            self.cal_fire_incident_id = self.fire_id.cal_fire_incident_id
        self.alert_time = datetime.now()
        try:
            distance_info = self.distance_to_fire()
            self.need_to_alert = distance_info[0]
            self.dist_to_fire = distance_info[1]
            self.closest_saved_location = distance_info[2]
        except:
            print("WARNING! Can Not Calculate Distance To Fire. Is Lat/Lng Info Avail?")
        finally:
            distance_info = None
        if self.fire_id is not None:
            self.fire_id_id = self.fire_id.fire_id
        super(Alert, self).save(*args, **kwargs)

