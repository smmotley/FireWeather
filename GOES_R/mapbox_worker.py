import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FireWeather.settings')
django.setup()
import matplotlib.pyplot as plt
from mpl_toolkits.basemap import Basemap
import cartopy.crs as ccrs
import io
from noaa_aws import AwsGOES
from GOES_Image_Creator import Fire_Image
from timeloop import Timeloop
from datetime import datetime, timedelta
import pytz
import sqlite3
import boto3
import numpy as np
from goesFire.models import GoesImages
from mapbox_tile_creator import TileRBG
from pyproj import Proj
t1 = Timeloop()

# Analise only the most recent file in the S3 bucket.
most_recent_scan = False
save_png_to_db = True
rioMaxZoomResolution = '6'  # Max Zoom for tile creation (For CONUS, 8 gives max res. For MESO 10 gives max).
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'db.sqlite3')
CONN = sqlite3.connect(DB_PATH, check_same_thread=False)
CURSOR = CONN.cursor()


@t1.job(interval=timedelta(minutes=5))
def main():
    '''
    Purpose: A simple worker program to tap into mapbox_tile_creator.py
            1) Download GOES-17 Multiband data from AWS cloud if the file hasn't already been downloaded.
            2) Send xarray object to mapbox_tile_creator.py to reproject to .mbtile specs
            3) Update database so file is not re-downloaded
            4) Place a .png file in the database of the True Color Image (not sure if this will ever be needed).
    :return:
    '''
    # Search the S3 bucket for the first scan that occurred closest to the following time
    first_scan = datetime.utcnow().strftime("%m/%d/%Y %H:%M")

    # The number of hours to search for files after "first_scan. If set to zero, this will get the latest scan.
    hours_of_data = 1

    # The noaa AWS resource is in an S3 bucket called 'noaa-goes##'
    s3 = boto3.resource('s3')
    bucket = 'noaa-goes17'

    # Object for the GOES multiband files in the S3 bucket
    goes_multiband = AwsGOES(
        bands=[7, 8],
        bucket=bucket,
        st_dt=first_scan,
        #domain='MESO1',
        domain="CONUS",
        hrs=hours_of_data)

    goes_multiband_files = goes_multiband.bucket_files

    if not goes_multiband_files:
        print("GOES SCAN DATA APPEARS TO BE DELAYED")
        hours_of_data = 3
        goes_multiband = AwsGOES(
            bands=[7, 8],
            bucket=bucket,
            #domain='MESO1',
            domain="CONUS",
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

    CURSOR.execute("SELECT s3_filename FROM goesFire_goesimages")
    already_examined = [item[0] for item in list(CURSOR.fetchall())]

    if most_recent_scan:
        goes_multiband_files = [goes_multiband.bucket_files[-1]]

    # Check if an image for the multiband file is already in the database. If not, download it.
    for FILE in (FILE for FILE in goes_multiband_files if FILE not in already_examined):
        C = goes_multiband.download_file(FILE,
                                         goes_multiband.bucket,
                                         s3)  # NETCDF File containing multiband GOES data

        midpoint = str(C['t'].data)[:-10]
        DATE = datetime.strptime(midpoint, '%Y-%m-%dT%H:%M:%S')
        DATE = DATE.replace(tzinfo=pytz.UTC)


        RGB_bands = Fire_Image(C=C, fileName=FILE).Composite
        tiles = TileRBG(C=C,
                        R_band=RGB_bands['R_band'],
                        B_band=RGB_bands['B_band'],
                        G_band=RGB_bands['G_band'],
                        maxZoom=rioMaxZoomResolution).CreateTiles

        png_blob = None
        if save_png_to_db:
            png_blob = png_db(C, RGB_bands, DATE)

        # Update the database to reflect the fact the current FDFC file has been examined.
        obj, created = GoesImages.objects.get_or_create(s3_filename=FILE, scan_dt=DATE, fire_temp_image=png_blob)
    return


def png_db(C, composite_img, DATE):
    # Satellite height
    sat_h = C['goes_imager_projection'].perspective_point_height

    # Satellite longitude
    sat_lon = C['goes_imager_projection'].longitude_of_projection_origin

    # Satellite sweep
    sat_sweep = C['goes_imager_projection'].sweep_angle_axis

    x = C['x'].values * sat_h
    y = C['y'].values * sat_h

    # Create a pyproj geostationary map object
    p = Proj(proj='geos', h=sat_h, lon_0=sat_lon, sweep=sat_sweep)

    # Perform cartographic transformation. That is, convert image projection coordinates (x and y)
    # to latitude and longitude values.
    XX, YY = np.meshgrid(x, y)
    lons, lats = p(XX, YY, inverse=True)

    # Draw zoomed map
    m = Basemap(resolution='i', projection='cyl', area_thresh=50000, llcrnrlon=-125,
                llcrnrlat=33,
                urcrnrlon=-113, urcrnrlat=43 )

    plt.figure(figsize=[15, 12])
    # We need an array the shape of the data, so use R. The color of each pixel will be set by color=colorTuple.
    newmap = m.pcolormesh(lons, lats, composite_img['R'], color=composite_img['rgb_composite'], linewidth=0, latlon=True)
    newmap.set_array(None)

    m.drawcountries(color='white')
    m.drawstates(color='white')
    m.drawcounties(color='white', linewidth=0.25)

    plt.title('GOES-17 True Color', loc='left', fontweight='semibold', fontsize=15)
    plt.title('%s' % DATE.strftime('%d %B %Y %H:%M UTC '), loc='right');

    buf = io.BytesIO()
    plt.savefig(buf, bbox_inches='tight', format='png')
    buf.seek(0)

    ablob = buf.getvalue()
    plt.close()
    buf.close()
    return ablob


            ################ EXTRA FUNCTIONS ###################
def extract_gif(scan_time):
    # sql = "SELECT fire_temp_gif FROM goes_r_images WHERE scan_dt = ? AND fire_temp_gif NOT NULL"
    sql = "SELECT fire_temp_image FROM goesFire_goesimages WHERE scan_dt = ? AND fire_temp_image NOT NULL"
    # param = {'scan_dt': scan_time}
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
    fire_id = -999  # Flag these image files to be deleted from the database.
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
    create_mp4(CONN, datetime.utcnow(), fire_id, hours_of_data)
    # sql = "DELETE from main.goes_r_images WHERE fire_id = ?"
    # CURSOR.execute(sql, [fire_id])
    # CONN.commit()
    return
            ################ END EXTRA FUNCTIONS ###################



if __name__ == "__main__":
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FireWeather.settings')
    main()



