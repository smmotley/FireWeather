from django.db import models
from django.contrib.gis.db import models as geomodels
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.validators import RegexValidator
from phonenumber_field.modelfields import PhoneNumberField
from django.contrib.gis.geos import Point
from django.db.models import Func, F

# This class allows for distance calculations from a Point on our goesR_Fire.py program.
# We could use POSTgis too, but this is easier to understand.
class WithDistanceManager(models.Manager):
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


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    #id = models.IntegerField(primary_key=True)
    alert_ok_time_start = models.DateTimeField(null=True, blank=True)
    alert_ok_time_end = models.DateTimeField(null=True, blank=True)
    userCords = geomodels.PointField(null=True, blank=True)
    fav1Cords = geomodels.PointField(null=True, blank=True)
    fav2Cords = geomodels.PointField(null=True, blank=True)
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
    alerted_calfire_incident_id = models.TextField(null=True, blank=True)
    need_to_alert = models.IntegerField(null=True, blank=True)
    dist_to_fire = models.FloatField(null=True, blank=True)
    alert_time = models.FloatField(null=True, blank=True)
    fire_lat = models.FloatField(null=True, blank=True)
    fire_lng = models.FloatField(null=True, blank=True)
    phone_number = PhoneNumberField(blank=True, null=True)
    objects = WithDistanceManager()

    def __str__(self):
        return f'{self.user.first_name}'

    #def save(self, *args, **kwargs):
    #    self.userCords = Point(self.user_lng, self.user_lat)
    #    self.fav1Cords = Point(self.fav1_lng, self.fav1_lat)
    #    self.fav2Cords = Point(self.fav2_lng, self.fav2_lat)
    #    super(Profile, self).save(*args, **kwargs)



    # Whenever there is a post_save in the User model, run the following code
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()

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
    is_active = models.IntegerField(null=True, blank=True)

    #class Meta:
        #db_table = "cal_fire"

class GoesImages(models.Model):
    id = models.IntegerField(primary_key=True)
    scan_dt = models.DateTimeField(null=True)
    fire_temp_image = models.BinaryField(null=True)
    fire_temp_gif = models.BinaryField(null=True)
    s3_filename = models.TextField(null=True)
    fire_id = models.TextField(null=True)

class GoesFireTable(models.Model):
    id = models.IntegerField(primary_key=True)
    cal_fire_incident_id = models.TextField(null=True)
    lat = models.FloatField()
    lng = models.FloatField()
    scan_dt = models.ForeignKey(GoesImages, default=1, on_delete=models.SET_DEFAULT)
    s3_filename = models.TextField()
    fire_id = models.IntegerField()

    class Meta:
        unique_together = ('lat', 'lng', 'scan_dt')


class FdfcFiles(models.Model):
    id = models.IntegerField(primary_key=True)
    s3_filename_fdfc = models.TextField(null=True)
    s3_filename_multiband = models.TextField()
    new_fires = models.IntegerField(null=True)
    scan_dt_fdfc = models.DateTimeField(null=True)
    scan_dt_multiband = models.DateTimeField(null=True)


class Alert(models.Model):
    users = models.ManyToManyField(User)
