from osgeo.gdalnumeric import *
import django
django.setup()
from pyproj import Proj, Geod, transform
from functools import partial
from datetime import datetime, timedelta
import sqlite3
import os, io, time, sys
import pandas as pd
import boto3
import numpy as np
from mpl_toolkits.basemap import Basemap
import matplotlib.pyplot as plt
from matplotlib.patches import Circle
import imageio
from PIL import Image
import shapely, shapely.ops
from shapely.geometry import Point, MultiPoint
import json
import logging
from django.conf import settings
from django.db.models import F, Q, Max, Min
from goesFire.models import Profile, Alert, GoesFireTable, CAfire
from django.db import connection, IntegrityError
from django.core.mail import send_mail
from GOES_Image_Creator import Fire_Image
from noaa_aws import AwsGOES
from timeloop import Timeloop
#import mailer

os.environ['DJANGO_SETTINGS_MODULE'] = 'FireWeather.settings'
logging.basicConfig(filename='logfile.log',level=logging.ERROR)
t1 = Timeloop()
GOES_NUMBER = '17'
debugging = True
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'db.sqlite3')
CONN = sqlite3.connect(DB_PATH, check_same_thread=False)
CURSOR = CONN.cursor()
starttime = time.time()

class Fire_Points:
    def __init__(self, fileName, id, dt, xres, yres):
        """
        Class object to hold data for each grid point that qualifies as a valid fire point.
        :param latlng (tuple(float)): The lat, lng from the center of a valid grid box.
        :param id (int): The id number of the fire used for grouping multiple points into a singe fire.
        :param dt (datetime): The datetime object of the radar scan.
        :param xres (float): The largest grid box in x-dir (longitude) within the raster.
        :param yres (float): The largest grid box in y-dir (latitude) within the raster.
        """
        self.fileName = fileName
        self.id = id
        self.dt = dt
        self.xres = xres
        self.yres = yres


@t1.job(interval=timedelta(minutes=5))
def main():
    """
    The program will run do the following:
        1) Temporarily download the necessary GOES-16/17 netCDF via AWS s3 bucket.
        2) Analise the netCDF raster for points in band 7 (red) that are greater than 329K (133F).
        3) If any points are > 329K:
            a) Group points of the same fire together (this is based on distance of each point from another).
            b) Determine if the fire group has already been designated as an "active fire" by CalFire.
                i) If so, ID this point with the CalFire indident ID.
                ii) if not, give it an arbitrary ID.
            c) Store the lat/lng, fire ID, and time of scan into the database.
        4) If active fire points were found, create an image for that scan and save it in the database.
        5) Alert user that a new fire has been found based on user's preferences (e.g. proximity to fire)
            a) Send text / email with:
                i) Link to CalFire's incident page for the fire (contained in csv that is downloaded)
                ii) gif loop of the last 2 hours of data from the GOES satellite.
                iii) Fire info relative to user (distance to fire, fire spread rate, etc)
        TODO: Future: 1) Determine frequency of scans based on fire risk, where fire risk is based on SPC fire outlook,
                      redflag warnings, fire watches, or model output (e.g. wind gusts / low humidity).
                      2) Allow user to select update about a specific fire they were alerted to.
    :return:
    """
    CONN = sqlite3.connect(DB_PATH, check_same_thread=False)
    CURSOR = CONN.cursor()
    # first_scan = "07/22/2019 23:00"     # Use for debugging.
    forced_mp4 = False   # Set to True if you want to force program to create an mp4 at a given lngLat
    forced_mp4_lnglat = (-122.24194399, 38.715556)


    # Analise only the most recent file in the S3 bucket.
    most_recent_scan = False

    # Search the S3 bucket for the first scan that occurred closest to the following time
    first_scan = datetime.utcnow().strftime("%m/%d/%Y %H:%M")

    # The number of hours to search for files after "first_scan. If set to zero, this will get the latest scan.
    hours_of_data = 1

    # The noaa AWS resource is in an S3 bucket called 'noaa-goes##'
    s3 = boto3.resource('s3')
    bucket = 'noaa-goes17'

    # Object for the GOES fire detection files (i.e. FDCF) in the S3 bucket
    goes_hotspot = AwsGOES(
                    bands=['FDCF'],
                    bucket=bucket,
                    st_dt=first_scan,
                    hrs=hours_of_data)

    # Object for the GOES multiband files in the S3 bucket
    goes_multiband = AwsGOES(
                    bands=[7,8],
                    bucket=bucket,
                    st_dt=first_scan,
                    hrs=hours_of_data)

    goes_multiband_files = goes_multiband.bucket_files

    if forced_mp4:
        # The time of the last scan
        starting_time = datetime.utcnow().strftime("%m/%d/%Y %H:%M")
        forced_loop_creator(goes_multiband, forced_mp4_lnglat, bucket, s3, starting_time, hours_of_data=2)
        sys.exit() # Stop program

    # Given the situation where the GOES-17 data are delayed and remain delayed for several hours (or days)
    # this will -- at the very least -- allow for alerts to continue if the data are no more than 3 hours old.
    # This will check if the list is empty, which indicates no GOES-17 files have been generated in the last hour.
    if not goes_multiband_files:
        print("GOES SCAN DATA APPEARS TO BE DELAYED")
        hours_of_data = 3
        goes_multiband = AwsGOES(
            bands=[7, 8],
            bucket=bucket,
            st_dt=first_scan,
            hrs=hours_of_data)
        try:
            lastf_time = datetime.strptime(((goes_multiband.bucket_files[-1])
                                            .split("_c")[1])
                                            .replace('.nc',""),"%Y%j%H%M%S%f")
            print(f"GOES DATA IS DELAYED, LATEST FILE IS: {abs(lastf_time - datetime.utcnow()).seconds / (60*60)} "
                  f" hours old." )
        except Exception as e:
            (print(f"Last GOES-17 Scan is more than 3 hours old...{e}"))

    if most_recent_scan:
        goes_multiband_files = [goes_multiband.bucket_files[-1]]

    # ALL_FILES contains a dict of key/values where the key is the multiband file and the value is the
    # most recent FDFC file to that particular multiband scan.
    ALL_FILES = find_closest_file(goes_multiband_files,goes_hotspot.bucket_files)

    CURSOR.execute("SELECT s3_filename_multiband FROM goesFire_fdfcfiles")
    already_examined = [item[0] for item in list(CURSOR.fetchall())]

    # Check if an image for the multiband file is already in the database. If not, download it.
    for FILE in (FILE for FILE in ALL_FILES.keys() if FILE not in already_examined):

        # Get Lat/lng values of all active fire points via GOES-R FIRE/HOTSPOT Characterization:
        # Additional Info: https://www.goes-r.gov/products/baseline-fire-hot-spot.html
        if debugging:
            import netCDF4 as nc
            Cf = nc.Dataset('../ABI_fire.nc', 'r')
        # Cf = goes_hotspot.download_file(ALL_FILES[FILE], goes_hotspot.bucket, s3)  # HOT SPOT DOWNLOAD
        # Cf = goes_hotspot.download_file('ABI-L2-FDCF/2019/218/17/OR_ABI-L2-FDCF-M6_G17_s20192181720341_e20192181729408_c20192181729505.nc', goes_hotspot.bucket, s3)  # HOT SPOT DOWNLOAD

        # Timestamp on Fire Characterization / Hotspot detection file.
        fdfc_seconds = int(np.ma.round(Cf.variables['t'][0], decimals=0))

        # Times reported in seconds since 2000-01-01 12:00:00
        fdfc_DATE = datetime(2000, 1, 1, 12) + timedelta(seconds=fdfc_seconds)

        # The lat / lng of GOES-R detected hotspots
        fire_latlng, xres, yres = fire_pixels(Cf)

        # Give each fire_latlng an ID: This will be done by assigning an arbitrary ID or getting the CAL Fire ID
        # The database groups individual points into fire complexes. If there is a new fire in the last scan,
        # it will need a new group id, which will be current_max_group_id + 1.
        CURSOR.execute("SELECT max(fire_id) FROM goesFire_goesfiretable WHERE fire_id IS NOT NULL")
        try:
            max_group_id = maximum(CURSOR.fetchone()[0], 0) + 1
        except TypeError:
            print("Is Database Empty? No, IDs Found...")
            max_group_id = 1

        # Renew CalFire DB and assign fire_latlng points with an ID (either from CalFire or this program).
        fire_group(fire_latlng, fdfc_DATE, xres, FILE, max_group_id)

        # Push any new incident IDs (GOES detected or CAL_Fire) into alert database. This will also return
        # the value of any new fires that a particular user needs to be alerted to.
        new_fires = update_alertDB(loop_duration=hours_of_data, user_email='smotley@mac.com')

        # Update the database to reflect the fact the current FDFC file has been examined.
        sql = '''INSERT INTO goesFire_fdfcfiles
                            (s3_filename_fdfc, s3_filename_multiband, scan_dt_fdfc, new_fires) 
                            VALUES (?, ?, ?, ?)'''
        CURSOR.execute(sql, [ALL_FILES[FILE], FILE, fdfc_DATE, new_fires])
        CONN.commit()

        if new_fires > 0:
            print("New Fire Detected, Setting up alert...")

            # Info needed for a new fire includes the fire's location and incident id number (either our id or CA_fire)
            sql = '''SELECT fire_lng, fire_lat, alerted_incident_id, alerted_cal_fire_incident_id 
                         FROM goesFire_profile WHERE user_id = 1 AND need_to_alert = 1'''
            CURSOR.execute(sql)
            resp = list(CURSOR.fetchall())
            map_lnglat = [item[0:2] for item in resp]
            fire_id = [item[2] for item in resp if item][-1]
            if not fire_id:
                fire_id = [item[3] for item in resp if item][-1]

            # A list of files already downloaded into the database and processed into .png images.
            CURSOR.execute("SELECT s3_filename FROM goesFire_goesimages WHERE fire_id = ?", [fire_id])
            already_downloaded = [item[0] for item in list(CURSOR.fetchall())]

            # To create an mp4 loop that is "hours_of_data" in length, we first need to get all the file names
            # of the multiband files.
            mp4_files = AwsGOES(
                    bands=[7,8],
                    bucket=bucket,
                    st_dt=fdfc_DATE.strftime("%m/%d/%Y %H:%M"),
                    hrs=hours_of_data).bucket_files

            # If the file isn't in our database yet, go download it.
            for mp4_file in (mp4_file for mp4_file in mp4_files if mp4_file not in already_downloaded):
            #for mp4_file in mp4_files:
                # Download multiband netcdf file
                C = goes_multiband.download_file(mp4_file, goes_multiband.bucket, s3)     # NETCDF File containing multiband GOES data

                # Seconds since 2000-01-01 12:00:00
                add_seconds = int(np.ma.round(C.variables['t'][0], decimals=0))
                DATE = datetime(2000, 1, 1, 12) + timedelta(seconds=add_seconds)

                # Timestamp difference between the GOES multiban scan and the GOES Fire detection scan. This should be < 6 min.
                scan_diff = abs(fdfc_DATE - DATE).seconds / 60

                print(f"DATE OF FDFC FILE: {fdfc_DATE}\n"
                      f"DATE OF MULTIBAND FILE: {DATE}\n"
                      f"MINUTES BETWEEN FILES:{scan_diff}")

                if scan_diff > 1:
                    logging.info("Duration between GOES mutiband and GOES Hotspot detection scan is " +
                                           str(scan_diff) + " minutes.")

                # Create a true color image and store the png file in the database.
                goes_firetemp_img(C, map_lnglat, mp4_file, fire_id, False)
            alert_user(new_fires, 1, fdfc_DATE, fire_id)
        else:
            print("No New Fires Found For: " + fdfc_DATE.strftime("%m/%d/%Y %H:%M"))
    print("COMPLETE!")
    CONN.close()
    return


def find_closest_file(multiband_files, hotspot_files):
    """
    The GOES-R produces multiple products that are placed in the in the AWS bucket. Not all the files are produced
    at the same time (or at all). For example, files for the Multiband product are typically produced
    every ~5 minutes whereas the Fire Hotspot detection files (aka FDFC files) are produced every 10 minutes.

    For a given scan, we want to the files are that closest in time to one another. This method will return a
    dict of key/value pairs where:

    Key: Multiband filename and the value is the...
    Value: Hotspot detection filename whose creation date is closest in time to the Multiband file.

    :param multiband_files: The file names of the Multiband files in the S3 bucket
    :param hotspot_files: The files names of the hotspot detection files in the s3 bucket.
    :return: Dict of key/value pairs where
    Key: Multiband filename and the value is the
    Value: Hotspot detection filename whose creation date is closest in time to the Multiband file.
    """

    # Holder for file key/value pair dict.
    file_combo = {}

    # The naming convention of the files includes the timestamp in the filenames.
    # There are three timestamps in the file name: The '_c' is the "center" between the start and end time.
    # This will return a dict with a KEY: file path in the S3 bucket of the FDCF file and VALUE: the datetime of the scan.
    hotspot_file_times = {fname: datetime.strptime((fname.split("_c")[1]).replace('.nc',""),"%Y%j%H%M%S%f")
                          for fname in hotspot_files}


    for mb in multiband_files:
        # The naming convention of the files includes the timestamp in the filenames.
        # There are three timestamps in the file name: The '_c' is the "center" between the start and end time.
        mb_time = datetime.strptime((mb.split("_c")[1]).replace('.nc',""),"%Y%j%H%M%S%f")

        # Returns the time of the hotspot file that is closest in time to the mb_time.
        closest_hotspot_time = min(hotspot_file_times.values(), key=lambda t: abs(t-mb_time))

        # From the list of FDCF filepaths, return the file path for the given time.
        closest_hotspot_file = list(hotspot_file_times.keys())[list(hotspot_file_times.values()).index(closest_hotspot_time)]

        timedelta = abs(closest_hotspot_time - mb_time)

        # Append to dictionary
        file_combo[mb] = closest_hotspot_file
    return file_combo

def fire_pixels(C):
    """Determine if any points in Band 7 (thermal band) exceed a given temperature threshold.
        See: https://www.goes-r.gov/products/baseline-fire-hot-spot.html for details
    :param C_file: GOES netCDF file.
    :return: 1) list of tuples containing locations where fire has been detected (lat,lng)
             2) xres and yres the max resolution of a gridbox. This will be used in our fire_group function
                to test whether a fire_point is associated with the same fire as another point
    """

    scan_mid = int(np.ma.round(C.variables['t'][0], decimals=0))
    DATE = datetime(2000, 1, 1, 12) + timedelta(seconds=scan_mid)

    # Load the RGB arrays for muti-band data
    FM = C.variables['Mask'][:].data  # Fire Mask
    FM = FM.astype(np.float64)

    """ 
    Excerpt from: https://www.ncdc.noaa.gov/sites/default/files/attachments/ABI_L2_FHS_Provisional_ReadMe_0.pdf
    
    *** Operational  users  who  have  the  lowest  tolerance  for  false  alarms should use the “processed”
    *** and “saturated” categories (mask codes 10, 11, 30, and 31), but understand there can still be false alarms.
    
    
    # Mask 
    # Codes   Definition
    # -99   Initialization value, should never appear in outputs
    # 0     Non-processed region of input/output image
    # 10    Processed fire pixel (codes 10 and 30):             The highest  fire confidence category, includes  FRP, 
                                                                size, and temperature estimates.
    # 11    Saturated fire pixel (codes 11 and 31):             Very high confidence fires, but the pixel was at 
                                                                instrument saturation so no properties could be 
                                                                determined.
    # 12    Cloud contaminated fire pixel (codes 12 and 32):    A moderate confidence fire that appears to be 
                                                                partially obscured by cloud; intended for users with 
                                                                a high tolerance for false alarms.
    # 13    High probability fire pixel (codes 13 and 33):      A possible fire with a lower thermal signature than 
                                                                needed to be deemed a Processed fire pixel; 
                                                                FRP is calculated for these pixels; intended for 
                                                                userswith a high tolerance for false alarms; 
                                                                false alarms due to water clouds 
                                                                are common in this category.
    # 14    Medium probability fire pixel  (codes 14 and 34):   A medium confidence firewith a lower thermal 
                                                                signature than a High probability fire pixel would 
                                                                have for this pixel; intended for users with a high 
                                                                tolerance  for  false  alarms;  false  alarms  due  
                                                                to  water  clouds are  common  in  this category.
    # 15    Low probability fire pixel (codes 15 and 35):       Lowest confidence fire class, a large number of 
                                                                false alarms are to be expected, it is included 
                                                                as it also contains small and/or cooler fires; 
                                                                intended for users  with  a  high  tolerance  for  
                                                                false  alarms;  false  alarms  due  to  water  
                                                                clouds are common in this category.
    # 20    Reserved
    # 21    Reserved
    # 22    Reserved
    # 23    Reserved
    # 24    Reserved
    # 25    Reserved
    # 30    Temporally Filtered Processed fire pixel
    # 31    Temporally Filtered Saturated fire pixel
    # 32    Temporally Filtered Cloud contaminated fire pixel
    # 33    Temporally Filtered High probability fire pixel
    # 34    Temporally Filtered Medium probability fire pixel
    # 35    Temporally Filtered Low probability fire pixel
    # 40    Space pixel
    # 50    Localzenith angle block-out zone, greater than threshold of 80°
    # 60    Reflectance(glint)angle  or  solar  zenith  angle  block-out  zone,
    #       within  respective thresholds, 10° and 10° respectively
    # 100   Processed region of image
    # 120   Bad input data: missing data, 3.9 μm (Channel7)
    # 121   Bad input data: missing  data, 11.2 μm ( Channel14)
    # 123   Bad input data: saturation, 3.9 μm ( Channel7)
    # 124   Bad input data: saturation, 11.2 μm ( Channel14)
    # 125   Invalid  reflectivity  product  input(value  <0).
    #       Can  be  indicative  of  localized  spikes in the reflectivity product/bad data
    # 126   Unusable input data: 3.9 μm ( Channel7)less than minimum threshold (200 K)
    # 127   Unusable input data: 11.2μm ( Channel14)less than minimum threshold (200 K)
    # 130   Reserved
    # 150   Invalid ecosystem type
    # 151   Sea water
    # 152   Coastline Fringe
    # 153   Inland Water and other Land/water mix
    # 155   Reserved
    # 160   Invalid emissivity value
    # 170   No background value could be computed
    # 180   Errorin converting between temperature and radiance
    # 182   Error in converting adjusted temperatures to radiance
    # 185   Values used for bisection technique to hone in on solutions for Dozier technique are invalid.
    # 186   Invalid radiances computed for Newton’s method for solving Dozier equations
    # 187   Errors in Newton’s method processing
    # 188   Error in computing pixel area for Dozier technique
    # 200   11.2 μm threshold cloud test
    # 205   3.9  μm (Channel7) minus  11.2  μm (Channel14) negative  difference  threshold cloud test
    # 210   3.9 μm (Channel7) minus 11.2 μm (Channel14) positive difference threshold cloud test
    # 215   Albedo threshold cloud test (daytime only)
    # 220   12.3μm (Channel15) threshold cloud test (only used when data available)
    # 225   11.2  μm (Channel14) minus 12.3μm (Channel15) negative  difference  threshold cloud test
    # 230   11.2  μm (Channel14) minus  12.3μm (Channel15) positive  difference  threshold cloud test
    # 240   Along  scan  reflectivity  product  test  to  identify  and  screen  for
    #       cloud  edge  used  in conjunction with 3.9 μm(Channel7)threshold
    # 245   Along  scan  reflectivity  product  test  to  identify  and  screen  for
    #       cloud  edge  used  in conjunction with albedo threshold
    """

    # Satellite height
    sat_h = C['goes_imager_projection'].perspective_point_height

    # Satellite longitude
    sat_lon = C['goes_imager_projection'].longitude_of_projection_origin

    # Satellite sweep
    sat_sweep = C['goes_imager_projection'].sweep_angle_axis

    # The projection x and y coordinates equals the scanning angle (in radians) multiplied by the satellite height
    # See details here: https://proj4.org/operations/projections/geos.html?highlight=geostationary
    X = C['x'][:] * sat_h
    Y = C['y'][:] * sat_h

    # XC and YC are the mid points of each grid box. Translating the function below:
    #       (X[1:] - X[-1]) is the difference between two adjoining grid boxes. Dividing by 2 gives us 1/2 of the
    #       distance between each grid box. Since this is a non-linear projection, this is the best we can do.
    #       Recall [1:] is everything except the first element and [:-1] is everything but the last element.
    #       Key Point: The + X[:-1] will now add the distance of 1/2 grid box to each grid box (except the last one,
    #       which is now dropped from the grid). We have essentially lopped off the last row in the GOES scan,
    #       so we'll also need to remove the last row of the FM data as well.
    XC = (X[1:] - X[:-1]) / 2 + X[:-1]
    YC = (Y[1:] - Y[:-1]) / 2 + Y[:-1]
    FM = FM[:-1, :-1]

    xres = np.max((X[1:] - X[:-1]) / 2)
    yres = np.max((Y[1:] - Y[:-1]) / 2) * -1

    # map object with pyproj
    p = Proj(proj='geos', h=sat_h, lon_0=sat_lon, sweep=sat_sweep)

    # Convert map points to latitude and longitude with the magic provided by Pyproj
    XXC, YYC = np.meshgrid(XC, YC)
    lons, lats = p(XXC, YYC, inverse=True)

    # Consider a point valid if the mask code is:
    # 10: Processed Fire Pixel
    # 30: Temporally Filtered Processed fire pixel (passed temporal test where previous scan was also a fire pixel)
    # 11: Saturated Fire Pixel
    # 31: Temporally Filtered Saturated fire pixel
    #
    # The above mask codes are the only four codes with a relatively LOW false alarm ratio.
    # Note: a fire pixel is only labeled with one code, so if a fire pixel is
    # processed (code 10) in the first scan, the next scan will likely mask the pixel as
    # a "Temporally Filtered Processed pixel (code 30).

    # Grab points with a mask = 10 or 11
    fire_pts = zip(lons[(FM == 10) | (FM == 11) | (FM == 30) | (FM == 31)],
                   lats[(FM == 10) | (FM == 11) | (FM == 30) | (FM == 31)])
    #fire_pts = zip(lons[(FM >= 10) & (FM <= 13)], lats[(FM >= 10) & (FM <= 13)])

    # Read in shapefile obtained from here: https://data.ca.gov/dataset/ca-geographic-boundaries
    ca_shapefile = osgeo.gdal.OpenEx(os.path.join(os.path.dirname(os.path.realpath(__file__)), 'CA_Shapefile', 'CA_State_TIGER2016.shp'))

    # Get reference projection of shapefile.
    # ca_spatial_ref = ca_shapefile.GetLayer().GetSpatialRef().ExportToWkt() # This gives a version of 3857 (mercator)

    # Get the points and put into Shapely multipolygon shape.
    ca_shape = ca_shapefile.GetLayer(0).GetFeature(0).ExportToJson()
    ca_polyXY = shapely.geometry.shape(json.loads(ca_shape)['geometry'])

    # Need to reproject from xy to latlng.
    reproj = partial(transform,
        Proj(init='epsg:3857'),     # source coordinate system (x/y)
        Proj(init='epsg:4326'))     # dest coordinate system (lon/lat)

    # Transform into lat lon
    ca_polyLL = shapely.ops.transform(reproj, ca_polyXY)

    # Don't use list comprehension with append since it will mutate the list.
    fire_pts_list = list(fire_pts)
    ca_fire_pts = []
    for pt in fire_pts_list:
        if Point(pt).within(ca_polyLL):
            ca_fire_pts.append(pt)

    # # FOR PLOTTING PURPOSES
    # FM[FM == -99] = np.nan
    # FM[FM == 40] = np.nan
    # FM[FM == 50] = np.nan
    # FM[FM == 60] = np.nan
    # FM[FM == 150] = np.nan
    # #FM[FM != 13] = np.nan
    # FM[FM == max(FM[0])] = np.nan
    # FM[FM == min(FM[0])] = np.nan
    #
    # l = {'latitude': 37.75,
    #      'longitude': -120.5}
    #
    # m = Basemap(resolution='i', projection='cyl', area_thresh=50000, llcrnrlon=l['longitude'] - 5,
    #             llcrnrlat=l['latitude'] - 5,
    #             urcrnrlon=l['longitude'] + 5, urcrnrlat=l['latitude'] + 5, )
    #
    # m.drawcoastlines()
    # m.drawcountries()
    # m.drawstates()
    # m.drawcounties()
    # file_loc = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'CA_Shapefile', 'CA_State_TIGER2016')
    # #m.readshapefile(shapefile=file_loc, name='CA_State_TIGER2016', linewidth=1)
    #
    # plt.figure(1, figsize=[15, 12])
    #
    # # In order to plot, you must do pcolormesh, not imshow. If you do imshow, the image will be stretched (no idea why).
    # m.pcolormesh(lons,lats,FM, latlon=True)
    # fire_latlng = lons[(FM >= 10) & (FM <= 14)], lats[(FM >= 10) & (FM <= 14)]
    # # Use the following code to place a blue dot in the center of a FIRE PIXEL.
    # x, y = m([i for i in fire_latlng[0].compressed()], [j for j in fire_latlng[1].compressed()])
    # m.plot(x, y, 'bo', markersize=18)
    #
    # #THE FOLLOWING WILL NOT WORK, must use pcolormesh instead
    # #m.imshow(FM, cmap="jet", vmin=0, vmax=255, origin='upper')  # Since "images" are upside down, we flip the RGB up/down
    # plt.show()
    # test = np.nanmin(FM)
    # test2 = np.nanmax(FM)

    return ca_fire_pts, xres, yres


def goes_firetemp_img(C, ca_fire_latlng, FILE, fire_id, only_RGB=False):
    composite_img = Fire_Image(C=C, fileName=FILE).Composite

    # Scan's start time, converted to datetime object
    scan_start = datetime.strptime(C.time_coverage_start, '%Y-%m-%dT%H:%M:%S.%fZ')

    scan_mid = int(np.ma.round(C.variables['t'][0], decimals=0))
    DATE = datetime(2000, 1, 1, 12) + timedelta(seconds=scan_mid)

    # Satellite height
    sat_h = C.variables['goes_imager_projection'].perspective_point_height

    # Satellite longitude
    sat_lon = C.variables['goes_imager_projection'].longitude_of_projection_origin

    # Satellite sweep
    sat_sweep = C.variables['goes_imager_projection'].sweep_angle_axis

    # The projection x and y coordinates equals the scanning angle (in radians) multiplied by
    # the satellite height (https://proj.org/operations/projections/geos.html)
    x = C.variables['x'][:] * sat_h
    y = C.variables['y'][:] * sat_h

    # map object with pyproj
    p = Proj(proj='geos', h=sat_h, lon_0=sat_lon, sweep=sat_sweep)

    # to latitude and longitude values.
    XX, YY = np.meshgrid(x, y)
    lons, lats = p(XX, YY, inverse=True)


    # Location of latest firepoint
    l = {'latitude': ca_fire_latlng[-1][1],
         'longitude': ca_fire_latlng[-1][0]}

    # Draw zoomed map
    m = Basemap(resolution='i', projection='cyl', area_thresh=50000, llcrnrlon=l['longitude'] - 2,
                llcrnrlat=l['latitude'] - 2,
                urcrnrlon=l['longitude'] + 2, urcrnrlat=l['latitude'] + 2, )

    # We need an array the shape of the data, so use R. The color of each pixel will be set by color=colorTuple.
    #newmap = m.pcolormesh(lons, lats, R, color=colorTuple, linewidth=0, latlon=True)
    #newmap.set_array(None)  # Without this line the RGB colorTuple is ignored and only R is plotted.

    plt.figure(figsize=[15, 12])
    #fig, ax = plt.subplots()

    map_text = {"PCWA": m(-121.05329, 38.922), "Forest Hill": m(-120.8334, 39.0180),
                "Hell Hole Res": m(-120.4100, 39.05795), "French Meadows": m(-120.4701, 39.1117)}

    #ax.annotate("PCWA", xy=m(-121.05329, 38.922))

    #ax.annotate([text_key for text_key in map_text.keys()],
    #            ([x[0] for x in map_text.values()], [y[1] for y in map_text.values()]),
    #            xytext=(5,5))

    newmap = m.pcolormesh(lons, lats, composite_img['R'], color=composite_img['rgb_tuple'], linewidth=0, latlon=True)
    newmap.set_array(None)

    plt.title('GOES-17 Fire Detection', loc='left', fontweight='semibold', fontsize=15)
    plt.title('%s' % scan_start.strftime('%d %B %Y %H:%M UTC'), loc='right');

    m.drawcountries(color='white')
    m.drawstates(color='white')
    m.drawcounties(color='white', linewidth=0.5)


    # # Use the following code to place a blue dot in the center of a FIRE PIXEL.
    # x,y = m([i[1] for i in R_Band_fire_latlng], [i[0] for i in R_Band_fire_latlng])
    # # PLACE BLUE DOT ON CENTER POINT OF OF VALID PIXEL
    # m.plot(x, y, 'bo', markersize=18)
    # for x, y in zip(x,y):
    #     fire_circle = Circle(xy=m(x, y), radius=0.25, fill=False, color='g', linewidth=1)
    #     plt.gca().add_patch(fire_circle)

    x2, y2 = m([i[0] for i in ca_fire_latlng], [i[1] for i in ca_fire_latlng])
    # PLACE RED DOT ON CENTER POINT OF OF VALID PIXEL
    #m.plot(x2, y2, 'ro', markersize=2)

    for x2, y2 in zip(x2,y2):
        fire_circle = Circle(xy=m(x2, y2), radius=0.2, fill=False, color='r', linewidth=2)
        plt.gca().add_patch(fire_circle)

    buf = io.BytesIO()
    plt.savefig(buf, bbox_inches='tight', format='png')
    buf.seek(0)
    #plt.show()

    # Store image into database
    ablob = buf.getvalue()
    sql = '''INSERT INTO goesFire_goesimages (fire_temp_image, scan_dt, s3_filename, fire_id) VALUES (?, ?, ?, ?)'''
    CONN.execute(sql, [ablob, DATE, FILE, fire_id])
    CONN.commit()
    buf.close()

    #extract_picture('2018-11-08 15:03:37')
    plt.close()
    return


def fire_group(fire_ll, DATE, xres, FILE, max_group_id):

    """ - Purpose: Determine if a GOES detected fire is a single pixel or a part of a larger group.
                - Pass in list of lat / lngs of fires ID'd by GOES-R.
                - Determine distance of each point to other points in the database.
                    - If distances are close enough, group the new point with the others
                    - If no other fire is close enough, this is a new fire. Give it an ID of (max id + 1)
                - Check the CAL Fire Database to see if CAL Fire has identified this fire.
                    - This will ultimately be used in the alert DB where, if the CAL fire DB has a fire, and
                      that fire is close to the user, but the cal fire ID isn't in our GoesFireTable DB, then
                      the Cal Fire has detected a fire before the GOES-R has.

        Groups individual fire points into a single fire complex and tests whether that fire is associated with
        a fire that CAL Fire has already identified. Update the SQL database.
    :param fire_ll: list of tuples in the form of (center latitude, center longitude) of each grid box
                    that has been assumed to be a valid fire.
    :param xres:    The grid box with the largest x_direction (lat) within the raster. This value isn't critical and
                    we could simply hard code the value in (it should be around 1000 meters), but we use it in the
                    function below to limit the acceptable distance of a given fire point to an ID'd fire from CALFire.
    :param yres:    Same as xres but in the y dir
    :return:        
    """
    fire_pts = [{"lat": ll[1], "lng":ll[0], "fire_id": nan, "scan_dt": DATE, "s3_filename":FILE} for ll in fire_ll]
    fire_group_num = max_group_id
    try:
        # Get largest group number ID
        fire_group_num = GoesFireTable.objects.order_by("fire_id").last().fire_id
    except AttributeError as e:
        print("Can not find a group number, is the database new? Changing group number to 1")
        fire_group_num = 0

    fire_group_num = fire_group_num + 1

    for ll in fire_ll:
        # The idea here is that we have three scenarios for a new fire pixel:
        #   CASES:
        # 1) It's a new fire that is too far away from any other fire to be considered a part of any other fire.
        #   --> In this case, give it a new ID.
        # 2) It's close enough to be considered a part of an existing fire.
        #   --> In this case, give it the same ID as the existing fire.
        # 3) It's between two (or more) merging fires, and this new pixel is serving to merge the other fires.
        #   --> In this case, use the smallest fire ID (e.g. if we have an id of 3,6,20 -> give it an ID of 3)
        #       AND give all the other fires the same ID as well (in the afformentioned case, fires 6, and 20
        #       would have their ID's CHANGED to 3 as well.

        # Find the maximum fire ID in the entire database
        maxID = GoesFireTable.objects.all().aggregate(max_id=Max('fire_id'))['max_id']

        # Get all points in database that are within 2 miles of this point, but also > 0 (don't want same point).
        closest_points = GoesFireTable.objects.fire_pixel_dist(ll[0], ll[1]) \
            .filter(distance__lt=(xres * 10), distance__gt=0)

        # ************** (CASE 1) fire_id = +1 **************
        # No close points in the entire database were found, give the current point a new fire_id.
        if closest_points.count() == 0:
            new_fire_id = list(sum(filter(None,[maxID,1])))[0]  # A fancy way to sum values if one of the values is None
            print(new_fire_id)
        # ************** CASE 2) fire_id = closest fire ID ***************
        # This point is close to another fire, give this point the same ID as the other fire.
        else:
            # Get the smallest fire group number of all the points that are close.
            new_fire_id = closest_points.aggregate(min_id=Min('fire_id'))['min_id']
            # fire_group_id = closest_points.order_by('-fire_id').last().fire_id
            if new_fire_id is None:
                new_fire_id = list(sum(filter(None,[maxID,1])))[0]  # A way to sum values if one of the values is None

            closest_pt_ids = closest_points.order_by().values_list('fire_id', flat=True).distinct()

            # Change any "None" values to nan so that we can update any nan values in the DB
           # closest_pt_ids = np.array(list(closest_pt_ids), dtype=np.float).tolist()

            # ************** CASE 3) merged fire --> fire_id still = closest fire_id ***************
            # There are multiple ID's that are close to this point, that means this pixel is merging two fires.
            # Update all ID's (including this new point) to the smallest ID.
            if len(closest_pt_ids) > 1:
                update_ids = GoesFireTable.objects.filter(fire_id__in=list(closest_pt_ids))
                update_ids.update(fire_id=new_fire_id)
        try:
            obj, created = GoesFireTable.objects.get_or_create(lat=ll[1],
                                                               lng=ll[0],
                                                               scan_dt=DATE,
                                                               s3_filename=FILE,
                                                               fire_id=new_fire_id)
            print(created)

        except IntegrityError as e:
            print("This point is already in the database --> \n " + e.args[0])


    # Now all of our fires have an ID associated with them. Let's now check every point that doesn't have a
    # CAL fire ID associated with it to see if there are any CAL fires close enough to be associated with that fire.

    calfires = CAfire.objects.filter(incident_is_final=0)
    for calfire in calfires:
        ca_lat = calfire.incident_latitude
        ca_lng = calfire.incident_longitude

        # Get all points in database that are within 4 miles of this point.
        closest_fire_pixels = GoesFireTable.objects.fire_pixel_dist(latitude=ca_lat, longitude=ca_lng) \
            .filter(distance__lt=(xres * 20))

        # Get any fire ID that is close to this point.
        closest_fire_ids = closest_fire_pixels.order_by().values_list('fire_id', flat=True).distinct()

        # For any fire_id that is close to this Cal Fire, update the calfire_id for all entries with that fire_id.
        if closest_fire_pixels.count() > 0:
            update_calfire_ids = GoesFireTable.objects.filter(fire_id__in=list(closest_fire_ids))
            update_calfire_ids.update(cal_fire_incident_id=calfire.incident_id)
            print(f"A Cal Fire incident {calfire.incident_id} was reported close to a GOES pixel id "
                  f"{closest_pt_ids[0]}")

    return

def alert_user(alert_num, userID, st_time, fire_id):
    sql = "SELECT * FROM goesFire_profile WHERE user_id = ?"
    df = pd.read_sql(sql, CONN, params=[userID])
    email_text = f"A total of {alert_num} new incidents have been reported. \n \n"
    for idx, row in df.iterrows():
        if row['need_to_alert']:
            if row['alerted_incident_id'] is not None:
                email_text += f"This is a GOES-R detected fire " \
                    f"{int(row['dist_to_fire'])} miles away from your saved location. \n \n"

                sql_update = "UPDATE goesFire_profile SET need_to_alert=FALSE WHERE user_id=? AND alerted_incident_id=?"
                CURSOR.execute(sql_update, [userID, row['alerted_incident_id']])
                CONN.commit()
            if row['alerted_cal_fire_incident_id'] is not None:
                sql = "SELECT * FROM goesFire_cafire WHERE incident_id = ?"
                df_calfire = pd.read_sql(sql, CONN, params=[row['alerted_cal_fire_incident_id']])

                email_text += f"This is a Cal Fire Reported Incident created on {df_calfire['incident_date_created'][0]}. " \
                    f"\n The fire is {int(row['dist_to_fire'])} miles away from your saved location." \
                    f"\n Current size of fire is: {df_calfire['incident_acres_burned'][0]} acres. Containment =  " \
                    f"{df_calfire['incident_containment'][0]}% \n" \
                    f"Additional Information: {df_calfire['incident_url'][0]} \n \n"


                sql_update = "UPDATE goesFire_profile SET need_to_alert=0 " \
                             "WHERE user_id=? AND alerted_cal_fire_incident_id=?"
                CURSOR.execute(sql_update, [userID, row['alerted_cal_fire_incident_id']])
                CONN.commit()

    # All alerts for this user should now be false, double check to make sure.
    sql_update = "SELECT * FROM goesFire_profile WHERE need_to_alert=1 " \
                 "AND user_id=?"
    CURSOR.execute(sql_update, [userID])
    if len(list(CURSOR.fetchall())) != 0:
        logging.CRITICAL("USERS ALERTS ARE NOT RESETTING!!")
        sql_update = "UPDATE goesFire_profile SET need_to_alert=0 " \
                     "WHERE user_id=? AND need_to_alert=1"
        CURSOR.execute(sql_update, [str(userID)])
        CONN.commit()

    create_mp4(CONN, st_time, fire_id, loop_hours=1)
    sql = "SELECT fire_temp_gif, MAX(scan_dt) FROM goesFire_goesimages WHERE fire_temp_gif NOT NULL"
    CURSOR.execute(sql)
    ablob = CURSOR.fetchone()
    filename = 'fire_latest.mp4'
    fpath = os.path.join(os.path.dirname(os.path.realpath(__file__)),filename)
    with open(fpath, 'wb') as output_file:
        output_file.write(ablob[0])
        print("SENDING EMAIL...")
        #mailer.send_mail(filename, email_text)
        print("EMAIL SENT...")
    return filename


def extract_gif(scan_time):
    #sql = "SELECT fire_temp_gif FROM goes_r_images WHERE scan_dt = ? AND fire_temp_gif NOT NULL"
    sql = "SELECT fire_temp_image FROM goesFire_goesimages WHERE scan_dt = ? AND fire_temp_image NOT NULL"
    #param = {'scan_dt': scan_time}
    CURSOR.execute(sql, [scan_time])
    ablob = CURSOR.fetchone()
    filename = 'test.png'
    with open(filename, 'wb') as output_file:
        output_file.write(ablob[0])
    return filename

def create_mp4(conn, scan_time, fire_id, loop_hours):
    frames = []
    cursor = conn.cursor()
    one_hour = scan_time - timedelta(hours=loop_hours)
    sql = "SELECT scan_dt FROM goesFire_goesimages WHERE scan_dt <= ? AND scan_dt >= ? AND fire_id = ?"
    cursor.execute(sql, [scan_time, one_hour, fire_id])
    timestamps = list(cursor.fetchall())
    fname = 'fire_cur.mp4'
    fpath = os.path.join(os.path.dirname(os.path.realpath(__file__)), fname)
    for imgtime in timestamps:
        sql = "SELECT fire_temp_image FROM goesFire_goesimages WHERE scan_dt = ? AND fire_id = ?"
        cursor.execute(sql, [imgtime[0], fire_id])
        imgFile = cursor.fetchone()
        img = Image.open(io.BytesIO(imgFile[0]))
        frames.append(img)
    try:
        imageio.mimwrite(fpath, frames, fps=5)
        with open(fpath, 'rb') as gif:
            ablob = gif.read()
            sql = '''UPDATE goesFire_goesimages SET fire_temp_gif = ? WHERE scan_dt = ?'''
            cursor.execute(sql, [sqlite3.Binary(ablob), timestamps[-1][0]])
            conn.commit()
    except:
        print("NO IMAGES TO PROCESS.")
    return


def update_alertDB(loop_duration, user_email):
    past_hour = datetime.utcnow() - timedelta(hours=loop_duration)
    if debugging:
        past_hour = datetime.utcnow() - timedelta(hours=100)

    # List of all GOES detected hotspots in the last hour.
    sql = "SELECT lng, lat, fire_id FROM goesFire_goesfiretable WHERE scan_dt >= ?"
    CURSOR.execute(sql, [past_hour])
    respGoesF = list(CURSOR.fetchall())

    # List of all the active CAL FIRE incidents.
    sql = "SELECT incident_longitude, incident_latitude, incident_id FROM goesFire_cafire WHERE is_active == 'Y'"
    CURSOR.execute(sql)

    # LatLng list of every active CalFire incident.
    calfirell = list(CURSOR.fetchall())

    # Get the coordinates of the user you're interested in alerting.
    sql = "SELECT profile.user_lng, profile.user_lat, profile.user_id " \
          "FROM goesFire_profile AS profile "
          #"LEFT JOIN auth_user AS u on profile.user_id = u.id WHERE u.email == ?"
    #CURSOR.execute(sql, [user_email])
    CURSOR.execute(sql)
    respUsers = list(CURSOR.fetchall())

    # arr = np.array(respUsers)
    # Latlng of user turned into Point cords
    #userll = Point(respUsers[0][:-1])

    #fire_dist = Profile.objects.with_distance(-120, 39.9, "miles").filter(distance_to_user__lt=F('user_radius'))
    #test = Profile.objects.with_distance(-120, 39.9, "miles")
    #test2 = list(test.filter(distance_to_user__lt=200))
    # User ID number
    userID = respUsers[0][2]

    # Did GOES detect any hotspots within range of user
    #for pt in [(-120.2,38.7,1)]:
    for pt in respGoesF:
        dist_to_users = Profile.objects.with_distance(pt[0],pt[1], "miles")\
            .filter(Q(distance_to_user__lt=F('user_radius')) | Q(distance_to_fav1__lt=F('fav1_radius')) |
                    Q(distance_to_fav2__lt=F('fav2_radius')))

        if dist_to_users.exists():
            for usr in dist_to_users:
                alert, created = Alert.objects.get_or_create(fire_id=pt[2], user_id=usr.user.id)
                if created:
                    print(f"New Alert Created For:  {usr.user}")

        # ll = Point(pt[:-1])  # Lat lng of point
        # fire_id = pt[2]  # ID given to fire
        #
        # geod = Geod(ellps='WGS84')
        # angle1, angle2, dist = geod.inv(ll.x, ll.y, userll.x, userll.y)  # Distance of user to fire in meters
        #
        # sql = "SELECT need_to_alert FROM goesFire_profile WHERE user_id = ? AND alerted_incident_id = ?"  # Check user has been alerted to this ID
        # CURSOR.execute(sql, [userID, fire_id])
        # already_alerted = CURSOR.fetchone()  # This will be None if not alerted yet.
        #
        # # 1 m = 0.00062 miles
        # # If dist is < 100 miles add this point to the user_alert_log and set need_to_alert value to True
        # if (dist*0.00062) < 100 and not already_alerted:
        #     sql = '''INSERT INTO goesFire_profile
        #                 (user_id, alerted_incident_id, alert_time, need_to_alert, dist_to_fire, fire_lng, fire_lat)
        #                 VALUES (?, ?, ?, ?, ?, ?, ?)'''
        #     CURSOR.execute(sql, [userID, fire_id,
        #                          datetime.now().strftime('%Y-%m-%d %H:%M:%S'), True, int(dist*0.00062),
        #                          pt[0], pt[1]])
        #     CONN.commit()

    # Test if any new CalFires have been identified that have NOT been picked up by the GOES satellite.
    for pt in calfirell:
        cfID = pt[2]  # The incident ID of the fire (given by CalFire)

        ca_dist_users = Profile.objects.with_distance(pt[0], pt[1], "miles") \
            .filter(Q(distance_to_user__lt=F('user_radius')) | Q(distance_to_fav1__lt=F('fav1_radius')) |
                    Q(distance_to_fav2__lt=F('fav2_radius')))

        if ca_dist_users.exists():
            for ca_usr in ca_dist_users:
                # If the fire table has the this incident ID, then it identified the CalFire with a GOES fire pixel.
                # and that info is stored in our database. If it the ID doesn't exist, that means CAL Fire ID'ed a
                # fire that wasn't observed by the GOES satellite. That's a problem because now you don't have a
                # lat lng stored in the database (may just start there to fix the issue)
                e = GoesFireTable.objects.filter(cal_fire_incident_id=cfID).first()
                if e is not None:
                    alert, created = Alert.objects.get_or_create(fire_id=e.id, user_id=ca_usr.user.id)

                # This is a new CalFire and it HAS NOT been observed by GOES. THIS SHOULD BE RARE!
                else:
                    alert, created = Alert.objects.get_or_create(fire_id=None,
                                                                 user_id=ca_usr.user.id,
                                                                 alerted_cal_fire_incident_id=cfID,
                                                              )
                if created:
                    print(f"New Alert Created For:  {ca_usr.user}")

    alerts = Alert.objects.filter(need_to_alert=True)
    for alert in alerts:
        user_alerts = Alert.objects.filter(need_to_alert=True, user_id=alert.user_id)
        msg = f'Alert: {user_alerts.count} New Fire Detected: '
        if user_alerts.count > 1:
            msg = f'Alert: {user_alerts.count} New Fires Detected: '
        i = 0
        for user_alert in user_alerts:
            i += 1
            msg = msg + f"\nFire #{i}: {user_alert.dist_to_fire} miles from {user_alert.closest_saved_location}"

        msg = msg + f"\n More Info: URL goes HERE"
    print(msg)
    #Alert.objects.filter(need_to_alert=True).update(need_to_alert=False)
    return


def forced_loop_creator(goes_multiband, center_lnglat, bucket, s3, starting_time, hours_of_data):
    """

    :param goes_multiband: The multiband file object
    :param center_lnglat:  The longitude, latitude point of interest (center point of image).
    :param bucket:         Passing s3 bucket name
    :param s3:             For boto3
    :param hours_of_data:  The duration of the mp4 loop in hours.
    :param starting_time:  The time of the last scan.
    :return:
    """
    fire_id = -999       # Flag these image files to be deleted from the database.
    CONN = sqlite3.connect(DB_PATH, check_same_thread=False)
    CURSOR = CONN.cursor()
    print("Forced Creation of MP4...")

    # To create an mp4 loop that is "hours_of_data" in length, we first need to get all the file names
    # of the multiband files.
    mp4_files = AwsGOES(
        bands=[7, 8],
        bucket=bucket,
        st_dt=starting_time,
        hrs=hours_of_data).bucket_files

    map_lnglat = [center_lnglat]

    # If the file isn't in our database yet, go download it.
    # for mp4_file in (mp4_file for mp4_file in mp4_files if mp4_file not in already_downloaded):
    for mp4_file in mp4_files:
        # Download multiband netcdf file
        C = goes_multiband.download_file(mp4_file, goes_multiband.bucket,
                                         s3)  # NETCDF File containing multiband GOES data

        # Create a true color image and store the png file in the database.
        goes_firetemp_img(C, map_lnglat, mp4_file, fire_id, False)
    create_mp4(CONN,datetime.utcnow(), fire_id, hours_of_data)
    #sql = "DELETE from main.goes_r_images WHERE fire_id = ?"
    #CURSOR.execute(sql, [fire_id])
    #CONN.commit()
    return


def append_db(data, conn):
    try:
        data.to_sql('goesFire_goesfiretable', conn, index=True, if_exists='append')
        return 'Success'
    except Exception as e:
        print("Initial failure to append: {}\n".format(e))
        print("Attempting to rectify...")
        existing = pd.read_sql('SELECT * FROM goesFire_goesfiretable', con=conn)
        to_insert = data.reset_index().rename(columns={'index': 'id'})
        mask = ~to_insert.id.isin(existing.id)
        try:
            to_insert.loc[mask].to_sql('goesFire_goesfiretable', con=conn, index=False, if_exists='append')
            print("Successful deduplication.")
        except Exception as e2:
            "Could not rectify duplicate entries. \n{}".format(e2)
        return 'Success after dedupe'


if __name__ == "__main__":
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FireWeather.settings')
    #alert, created = Alert.objects.get_or_create(user_id=1,
    #                                             alerted_cal_fire_incident_id='c9bb59f7-be32-4296-8c11-3f1233116827')
    main()
    t1.start(block=True)