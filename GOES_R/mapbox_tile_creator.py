import os, sys, platform
from datetime import datetime
from mapbox import Uploader
from subprocess import call, check_output
from datetime import datetime, timedelta, time
import requests
import json
import pytz
from pyproj import Proj
from osgeo import gdal
from osgeo import osr
import numpy as np
import rasterio
from rasterio import features, crs
#import fiona


class TileRBG:
    def __init__(self, C, R_band, G_band, B_band, maxZoom, mbtileFormat):
        self.data = C
        self.R_band = R_band
        self.G_band = G_band
        self.B_band = B_band
        self.tileMaxZoom = maxZoom
        self.mbtileFormat = mbtileFormat
        self.mb_access_token = os.environ['MAPBOX_UPLOADER_TOKEN']
        self.CreateTiles = self.GOES17_Tile_Creation()


    def GOES17_Tile_Creation(self):
        # Open the file
        try:
            C = self.data
        except:
            print("Can't open file:", self.fileName)
            return None
        delete_old_tiles = True
        # Scan's start time, converted to datetime object
        scan_start = datetime.strptime(C.time_coverage_start, '%Y-%m-%dT%H:%M:%S.%fZ')
        scan_start = scan_start.strftime("%Y%m%d_%H%M")
        # scan_mid = int(np.ma.round(C.variables['t'][0], decimals=0))
        # DATE = datetime(2000, 1, 1, 12) + timedelta(seconds=scan_mid)
        # Satellite height
        sat_h = C['goes_imager_projection'].perspective_point_height

        # Satellite longitude
        sat_lon = C['goes_imager_projection'].longitude_of_projection_origin

        # Satellite sweep
        sat_sweep = C['goes_imager_projection'].sweep_angle_axis

        major_ax = C['goes_imager_projection'].semi_major_axis
        minor_ax = C['goes_imager_projection'].semi_minor_axis

        # The projection x and y coordinates equals the scanning angle (in radians) multiplied by
        # the satellite height (https://proj.org/operations/projections/geos.html)
        x = C['x'].values * sat_h
        y = C['y'].values * sat_h

        # map object with pyproj
        p = Proj(proj='geos', h=sat_h, lon_0=sat_lon, sweep=sat_sweep)

        # to latitude and longitude values.
        XX, YY = np.meshgrid(x, y)
        lons, lats = p(XX, YY, inverse=True)

        nx = C['x'].size
        ny = C['y'].size

        xmin, ymin, xmax, ymax = [x.min(), y.min(), x.max(), y.max()]
        xres = (xmax - xmin) / float(nx)
        yres = (ymax - ymin) / float(ny)

        # The satellite seems to be off in the x-dir by 4 pixels and 2 pixels in the y-dir
        #x_adjustment_factor = xres * 4
        #y_adjustment_factor = yres * 2
        x_adjustment_factor = xres * 0
        y_adjustment_factor = yres * 0
        geotransform = ((xmin + x_adjustment_factor), xres, 0, (ymax - y_adjustment_factor), 0, -yres)

        R_band = self.R_band * 255
        G_band = self.G_band * 255
        B_band = self.B_band * 255

        # Get the path name of the directory for our GEOTIF and MBTILES
        dir_path = os.path.dirname(os.path.realpath(__file__))
        print("Your Files Are Saving Here: " + dir_path)

        # The file created here will be overwritten every time. The geotiff is fed into rio mbtiles.
        dst_ds = gdal.GetDriverByName('GTiff').Create(os.path.join(dir_path,'GOES17.tif'), nx, ny, 3, gdal.GDT_Byte)
        #dst_ds = gdal.Open('GOES17.tif', nx, ny, 3, gdal.GDT_Byte)

        # FROM: https://github.com/lanceberc/GOES/blob/master/GOES_GDAL.ipynb
        # The important part of this is to use the +over in the projection. It accounts for the fact that
        # the image crosses -180 W
        goes17_proj = f"+proj=geos -ellps=GRS80 +f=.00335281068119356027 +sweep=x +no_defs +lon_0={sat_lon} " \
                      f"+h={sat_h} +x_0=0 +y_0=0 +a={major_ax} +b={minor_ax} +units=m +over +lon_wrap=-180"

        # HUGE HELP! FROM: https://github.com/lanceberc/GOES/blob/master/GOES_GDAL.ipynb
        # The EPSG definition of Mercator doesn't allow longitudes that extend past -180 or 180 which makes
        # working in the Pacific difficult. Define our own centralized on the anti-meridian to make working
        # with GOES-17 (which crosses the anti-meridian) continuous.
        #proj_anti_mercator = "+proj=merc +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +over +lon_0=-180"
        proj_anti_mercator = "+proj=merc +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +over +lon_0=0 +lon_wrap=-180"

        warpOptions = gdal.WarpOptions(
            format="GTiff",
            width=nx,
            height=ny,
            outputBoundsSRS="EPSG:4326",  # WGS84 - Allows use of lat/lon outputBounds
            outputBounds=[-161.0, 15.0, -103.0, 50.0], # lat/long of ll, ur corners
            dstSRS="EPSG:4326",  # GOES-17 full-disk crosses the anti-meridian
            warpOptions=["SOURCE_EXTRA=500"],  # Magic from The Internet for off-earth pixels
            multithread=True,  # Not sure if this buys anything on my setup
        )

        dst_ds.SetGeoTransform(geotransform)                  # specify coords
        # srs.ImportFromEPSG(3857)                            # WGS84 x/y
        # srs.ImportFromEPSG(4326)                            # WGS84 lat/long
        dst_ds.GetRasterBand(1).WriteArray(R_band)            # write r-band to the raster
        dst_ds.GetRasterBand(2).WriteArray(G_band)            # write g-band to the raster
        dst_ds.GetRasterBand(3).WriteArray(B_band)            # write b-band to the raster

        srs = osr.SpatialReference()                          # establish encoding
        srs.ImportFromProj4(goes17_proj)                      # Get the projection of the GOES-17.

        dst_ds.SetProjection(srs.ExportToWkt())               # set the projection of our geotiff to match the GOES-17
        gdal.Warp(os.path.join(dir_path,'GOES17_warped.tif'), dst_ds, options=warpOptions)
        dst_ds.FlushCache()                                   # write to disk
        dst_ds = None                                         # clear data

        # rio is installed by conda by installing "rasterio". You still need to >pip install rio-mbtiles and automatically installs the exe files for command lines. Need to tell python
        # where the path to rio exists. Using $> which rio incase the install directory changes.
        # rio_path = check_output('which rio')
        rio_path = "/opt/anaconda3/envs/django_python/bin/rio"
        if "Linux" in platform.platform(terse=True):
            rio_path = "/var/www/venv/django_python/bin/rio"

        # The path of our file created by the RGB bands above.
        input_path = os.path.join(dir_path, "GOES17_warped.tif")

        tile_source = f'GOES17_{scan_start}.mbtiles'
        tile_id = f'GOES17_{scan_start}'

        # If user wants raster tiles, then use rio to create the mbtiles.
        if self.mbtileFormat != 'polygon':
            call([rio_path, 'mbtiles', '--format', 'PNG', '--overwrite', '--zoom-levels', f'1..{self.tileMaxZoom}', input_path, tile_source])

        # If the user wants vector tiles, then use rasterio and fiona to create the geojson, then use
        # tippecanoe to create the vector tiles from the geojson
        else:
            polygonize(input_path)
            json_source = os.path.join(dir_path, "GOES17_Poly.json")

            call(['tippecanoe', '--force', '-l', 'goes17_fire', '--coalesce', '-P', '-D9', '-z6', '--grid-low-zooms', '-o', tile_source, json_source])
        uploader = Uploader(access_token=self.mb_access_token)
        tile_list = requests.get(f'https://api.mapbox.com/tilesets/v1/smotley?access_token={self.mb_access_token}')
        tile_list = json.loads(tile_list.text)

        if delete_old_tiles:
            delete_tilesets(tile_list, self.mb_access_token)
        with open(tile_source, 'rb') as src:
            # test = requests.delete(f'https://api.mapbox.com/tilesets/v1/smotley.GOES17_TC_Fire?access_token={mb_access_token}')
            print("UPLOADING TILE " + tile_source)
            upload_resp = uploader.upload(src, tile_id)
            if upload_resp.status_code == 201:
                print("DONE UPLOADING TILE " +tile_id)  # Dict containing RGB colorTuple that combines the FireTemp and TrueColor
            else:
                print("UPLOAD FAILED")
            os.remove(tile_source)                     # Delete .mbtiles file
        return


def delete_tilesets(tile_list, mb_access_token):
    goes_tiles = [obj for obj in tile_list if 'GOES17_' in obj['name']]
    for tile_set in goes_tiles:
        tile_time = (tile_set['name']).split('GOES17_',1)[1]
        tile_time = datetime.strptime(tile_time, "%Y%m%d_%H%M").replace(tzinfo=pytz.utc)
        # Delete any images older than 4 hours.
        if tile_time < (datetime.now(pytz.utc) - timedelta(hours=6)):
            print("DELETING TILESET: "+tile_set['id'])
            d = requests.delete(f"https://api.mapbox.com/tilesets/v1/{tile_set['id']}?access_token={mb_access_token}")


def polygonize(input_path):
    with rasterio.open(input_path, mode='r+') as src:
        print("Polygonizing GeoTIFF")
        # from https://stackoverflow.com/questions/17615963/standard-rgb-to-grayscale-conversion
        r = src.read(1)
        g = src.read(2)
        b = src.read(3)

        rgb = (r * 256 ** 2) + g * 256 + b
        rgb = rgb.astype('float32')

        # Make a mask
        # mask = grayscale != 1
        # iterate over shapes.
        results = (
            {'properties': {'raster_val': v}, 'geometry': s}
            for i, (s, v) in enumerate(features.shapes(rgb, transform=src.transform)))
        with fiona.open(
                'GOES17_Poly'
                '.json', 'w',
                driver='GeoJSON',
                crs=src.crs.wkt,
                schema={'properties': [('raster_val', 'int')],
                        'geometry': 'Polygon'}) as dst:
            dst.writerecords(results)
        print("Successfully polygonized GeoTIFF to JSON")
        return
