# Generated by Django 3.0.3 on 2020-06-23 19:27

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import phonenumber_field.modelfields


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='CAfire',
            fields=[
                ('id', models.IntegerField(primary_key=True, serialize=False)),
                ('incident_id', models.CharField(blank=True, max_length=200, null=True)),
                ('incident_name', models.TextField(blank=True, null=True)),
                ('incident_is_final', models.IntegerField(blank=True, null=True)),
                ('incident_date_last_update', models.TextField(blank=True, null=True)),
                ('incident_date_created', models.TextField(blank=True, null=True)),
                ('incident_administrative_unit', models.TextField(blank=True, null=True)),
                ('incident_county', models.TextField(blank=True, null=True)),
                ('incident_location', models.TextField(blank=True, null=True)),
                ('incident_acres_burned', models.IntegerField(blank=True, null=True)),
                ('incident_containment', models.IntegerField(blank=True, null=True)),
                ('incident_control', models.TextField(blank=True, null=True)),
                ('incident_cooperating_agencies', models.TextField(blank=True, null=True)),
                ('incident_longitude', models.FloatField(blank=True, null=True)),
                ('incident_latitude', models.FloatField(blank=True, null=True)),
                ('incident_type', models.TextField(blank=True, null=True)),
                ('incident_url', models.TextField(blank=True, null=True)),
                ('incident_date_extinguished', models.TextField(blank=True, null=True)),
                ('incident_dateonly_extinguished', models.TextField(blank=True, null=True)),
                ('incident_dateonly_created', models.TextField(blank=True, null=True)),
                ('is_active', models.IntegerField(blank=True, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='FdfcFiles',
            fields=[
                ('id', models.IntegerField(primary_key=True, serialize=False)),
                ('s3_filename_fdfc', models.TextField(null=True)),
                ('s3_filename_multiband', models.TextField()),
                ('new_fires', models.IntegerField(null=True)),
                ('scan_dt_fdfc', models.DateTimeField(null=True)),
                ('scan_dt_multiband', models.DateTimeField(null=True)),
            ],
        ),
        migrations.CreateModel(
            name='GoesImages',
            fields=[
                ('id', models.IntegerField(primary_key=True, serialize=False)),
                ('scan_dt', models.DateTimeField(null=True)),
                ('fire_temp_image', models.BinaryField(null=True)),
                ('fire_temp_gif', models.BinaryField(null=True)),
                ('s3_filename', models.TextField(null=True)),
                ('fire_id', models.TextField(null=True)),
            ],
        ),
        migrations.CreateModel(
            name='Profile',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('alert_ok_time_start', models.DateTimeField(blank=True, null=True)),
                ('alert_ok_time_end', models.DateTimeField(blank=True, null=True)),
                ('user_lat', models.FloatField(blank=True, null=True)),
                ('user_lng', models.FloatField(blank=True, null=True)),
                ('fav1_lat', models.FloatField(blank=True, null=True)),
                ('fav1_lng', models.FloatField(blank=True, null=True)),
                ('fav2_lat', models.FloatField(blank=True, null=True)),
                ('fav2_lng', models.FloatField(blank=True, null=True)),
                ('fav1_desc', models.CharField(blank=True, max_length=30, null=True)),
                ('fav2_desc', models.CharField(blank=True, max_length=30, null=True)),
                ('user_radius', models.IntegerField(blank=True, default=50, null=True)),
                ('fav1_radius', models.IntegerField(blank=True, default=50, null=True)),
                ('fav2_radius', models.IntegerField(blank=True, default=50, null=True)),
                ('last_alert', models.DateTimeField(blank=True, null=True)),
                ('alerted_calfire_incident_id', models.TextField(blank=True, null=True)),
                ('dist_to_fire', models.FloatField(blank=True, null=True)),
                ('alert_time', models.FloatField(blank=True, null=True)),
                ('fire_lat', models.FloatField(blank=True, null=True)),
                ('fire_lng', models.FloatField(blank=True, null=True)),
                ('phone_number', phonenumber_field.modelfields.PhoneNumberField(blank=True, max_length=128, null=True, region=None)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='GoesFireTable',
            fields=[
                ('id', models.IntegerField(primary_key=True, serialize=False)),
                ('cal_fire_incident_id', models.TextField(null=True)),
                ('lat', models.FloatField()),
                ('lng', models.FloatField()),
                ('s3_filename', models.TextField()),
                ('fire_id', models.IntegerField()),
                ('scan_dt', models.ForeignKey(default=1, on_delete=django.db.models.deletion.SET_DEFAULT, to='goesFire.GoesImages')),
            ],
            options={
                'unique_together': {('lat', 'lng', 'scan_dt')},
            },
        ),
        migrations.CreateModel(
            name='Alert',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('dist_to_fire', models.FloatField(null=True)),
                ('alert_time', models.DateTimeField(null=True)),
                ('need_to_alert', models.BooleanField(null=True)),
                ('alerted_cal_fire_incident_id', models.CharField(blank=True, max_length=200, null=True)),
                ('closest_saved_location', models.CharField(blank=True, max_length=200, null=True)),
                ('fire_id', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='goesFire.GoesFireTable')),
                ('user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
