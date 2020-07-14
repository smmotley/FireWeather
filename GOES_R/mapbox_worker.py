import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FireWeather.settings')
django.setup()
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
t1 = Timeloop()

# Analise only the most recent file in the S3 bucket.
most_recent_scan = False
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'db.sqlite3')
CONN = sqlite3.connect(DB_PATH, check_same_thread=False)
CURSOR = CONN.cursor()


@t1.job(interval=timedelta(minutes=5))
def main():
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
        hrs=hours_of_data)

    goes_multiband_files = goes_multiband.bucket_files

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

    CURSOR.execute("SELECT s3_filename FROM goesFire_goesimages")
    already_examined = [item[0] for item in list(CURSOR.fetchall())]

    if most_recent_scan:
        goes_multiband_files = [goes_multiband.bucket_files[-1]]

    # Check if an image for the multiband file is already in the database. If not, download it.
    for FILE in (FILE for FILE in goes_multiband_files if FILE not in already_examined):
        C = goes_multiband.download_file(FILE,
                                         goes_multiband.bucket,
                                         s3)  # NETCDF File containing multiband GOES data

        # Seconds since 2000-01-01 12:00:00
        add_seconds = int(np.ma.round(C.variables['t'][0], decimals=0))
        DATE = datetime(2000, 1, 1, 12, tzinfo=pytz.UTC) + timedelta(seconds=add_seconds)

        RGB_bands = Fire_Image(C=C, fileName=FILE).Composite
        tiles = TileRBG(C=C, R_band=RGB_bands['R_band'], B_band=RGB_bands['B_band'], G_band=RGB_bands['G_band']).CreateTiles


        # Update the database to reflect the fact the current FDFC file has been examined.
        obj, created = GoesImages.objects.get_or_create(s3_filename=FILE,scan_dt=DATE)

if __name__ == "__main__":
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FireWeather.settings')
    main()



