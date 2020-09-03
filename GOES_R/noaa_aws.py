from datetime import datetime, timedelta
import pytz
import boto3
import tempfile
import os
import xarray as xr

class AwsGOES(object):
    def __init__(self, bands, st_dt, hrs, bucket, domain):
        """
        Class object for accessing GOES data on the AWS server.
        :param goesNum (str): GOES-R satellite number (either 16 or 17).
        :param band (list(int)): The band numbers (1-16).
        :param st_dt (str): Find available data after this time...in mm/dd/yyyy HH:MM'.
        :param hrs (int): Number of hours after st_dt. If zero, it means user wants the
                            first scan found on or after st_dt.
        """
        self.bucket = bucket
        self.bands = bands
        self.domain = domain
        self.product = self.getProduct()
        self.st_dt = datetime.strptime(st_dt, '%m/%d/%Y %H:%M').replace(tzinfo=pytz.UTC)
        self.hrs = hrs
        self.bucket_files = self.getFileNames()
        self.nc = ""

    # Will return info about the Class to a user typing variable name.  You can return
    # anything about the object you want.
    def __repr__(self):
        return "AwsGOES({}, {})".format(self.bucket, self.st_dt)

    def getProduct(self):
        #   PRODUCTS           Discription
        # 'ABI-L1b-RadF'    Full Disk Radiances
        # 'ABI-L1b-RadC'    CONUS Radiances: Use for constructing actual images
        # 'ABI-L2-CMIPC'    Single Band CONUS Cloud & Moisture Imagery
        # 'FDCF'            Fire Detection and Characterization.
        # ABI-L2-MCMIPCM1     MESO 1
        if self.bands[0] == 'FDCF':
            product = 'ABI-L2-FDCF'         # Fire Detection and Characterization.
        if len(self.bands) > 1:
            product = 'ABI-L2-MCMIPC'       # CONUS Multi-Channel
            if self.domain == "MESO1":
                product = 'ABI-L2-MCMIPM'
        return product


    def getFileNames(self):
        s3 = boto3.resource('s3')
        bucket = s3.Bucket(self.bucket)

        file_paths = []

        product = self.product

        # Gets last two characters of bucket name (either goes16, goes17)
        goesNum = self.bucket[-2:]

        # Look through the S3 bucket for files meeting criteria based on scan start time.
        for hr in range(0,self.hrs+1):
            # Date format in UTC
            date_of_hr = (self.st_dt - timedelta(hours=hr)).replace(tzinfo=pytz.UTC)

            # The file naming convention uses a Day of Year standard.
            doy = date_of_hr.timetuple().tm_yday

            scanMode = "M6"
            # Prior to April 1, 2018 the scan modes were in mode 3

            meso_sector = ""
            if self.domain == 'MESO1':
                meso_sector = "1"
            if self.domain == 'MESO2':
                meso_sector = "2"

            if date_of_hr < datetime(2019, 4, 1).replace(tzinfo=pytz.UTC):
                scanMode = "M3"
            if len(self.bands) == 1 :
                # For single band data, the files contain the channel number (e.g. M6C07 where M6 is scan mode
                # and C07 is channel 7. Also check to make sure we're not looking for
                if type(self.bands[0]) is int:
                    scanMode = f"{scanMode}C{self.bands[0]:02}"
            prefix = f"{product}/{date_of_hr.year}/{doy}/{date_of_hr.hour:02}/OR_{product}{meso_sector}-{scanMode}_G{goesNum}_"  # Multi Band
            objs = bucket.objects.filter(Prefix=prefix)
            #for ob in objs:
                #print(ob)

            file_paths.extend([o.key for o in objs])
        file_paths.sort(key=lambda x:x.split("_c")[1])
        return file_paths

    def download_file(self, FILE, bucket, s3):
        try:
            tempf = tempfile.NamedTemporaryFile().name  # Creates temporary file that is automatically deleted on close
            #tempf = os.path.join("/Users/motley/Documents/PycharmProjects/PlayGround/FireWeather", "GOES17_NOW.nc")
            fname = FILE.split("_")[-1]
            print("Downloading :", FILE)
            s3.Bucket(bucket).download_file(FILE, tempf)
            #print("YOU ARE DOWNLOADING A STATIC FILE SAVED TO DISK: ")
            print("Download Successful", tempf)
            #C = nc.Dataset(tempf, 'r')
            C = xr.open_dataset(tempf)                      # Now using xarray.
            return C
        except Exception as e:
            print("Can't open file:", tempf)
            print("ERROR: ", e)
            return None