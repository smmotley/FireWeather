import numpy as np

class Fire_Image:
    def __init__(self, fileName, C):
        self.fileName = fileName
        self.data = C
        self.FireTemp = {}                          # Dict containing RGB colorTuple that is false color
        self.TrueColor = self.GOES_truecolor()  # Dict containing RGB colorTuple created using a True Color recipe
        self.Composite = self.GOES_composite()  # Dict containing RGB colorTuple that combines the FireTemp and TrueColor

    def GOES_truecolor(self, only_RGB=False, night_IR=True):
        """
        Uses Channel 1, 2, 3, to create a "True Color" image.
        Input:
            FILE - name of the netcdf file. Must be the multiband formatted data file.
                   i.e. OR_ABI-L2-MCMIPC-M3_G16_s20172651517227_e20172651520000_c20172651520109.nc
            only_RGB - if True, only returns the RGB value, and not the additional details
            night_IR - if True, replaces darkness from night time with IR image
        """

        # Open the file
        try:
            C = self.data
            #print("Fetching:", self.fileName)
        except:
            print("Can't open file:", self.fileName)
            return None

        # Load the RGB arrays
        TC_R = C['CMI_C02'][:].data
        TC_G = C['CMI_C03'][:].data
        TC_B = C['CMI_C01'][:].data

        # Turn empty values into nans
        try:
            TC_R[TC_R == -1] = np.nan
            TC_G[TC_G == -1] = np.nan
            TC_B[TC_B == -1] = np.nan
        except:
            print(Warning("CREATING AN IMAGE RAN INTO ISSUES WITH EMPTY VALUES"))
            pass

        # Apply range limits for each channel becuase RGB values must be between 0 and 1
        TC_R = np.maximum(TC_R, 0)
        TC_R = np.minimum(TC_R, 1)
        TC_G = np.maximum(TC_G, 0)
        TC_G = np.minimum(TC_G, 1)
        TC_B = np.maximum(TC_B, 0)
        TC_B = np.minimum(TC_B, 1)

        # Apply the gamma correction
        gamma = 0.4
        TC_R = np.power(TC_R, gamma)
        TC_G = np.power(TC_G, gamma)
        TC_B = np.power(TC_B, gamma)

        # Calculate the "True" Green
        TC_G_true = 0.48358168 * TC_R + 0.45706946 * TC_B + 0.06038137 * TC_G
        TC_G_true = np.maximum(TC_G_true, 0)
        TC_G_true = np.minimum(TC_G_true, 1)

        # Modify the RGB color contrast:
        contrast = 125
        TC_RGB_contrast = contrast_correction(np.dstack([TC_R, TC_G_true, TC_B]), contrast)

        if night_IR == True:
            # Prepare the Clean IR band by converting brightness temperatures to greyscale values
            # From: https://github.com/occ-data/goes16-play/blob/master/plot.py
            cleanIR = C.variables['CMI_C13'][:].data
            try:
                cleanIR[cleanIR == -1] = np.nan
            except:
                print("THE NIGHT IR RAN INTO AN ISSUE WITH NAN VALUES")

            # Apply range limits for clean IR channel
            cleanIR = np.maximum(cleanIR, 90)
            cleanIR = np.minimum(cleanIR, 313)

            # Normalize the channel between a range
            cleanIR = (cleanIR - 90) / (313 - 90)

            # Invert colors
            cleanIR = 1 - cleanIR

            # Lessen the brightness of the coldest clouds so they don't appear so bright near the day/night line
            cleanIR = cleanIR / 1.5

            # Return the final RGB array with CleanIR...
            TC_RGB = np.dstack(
                [np.maximum(TC_RGB_contrast[:, :, 0], cleanIR), np.maximum(TC_RGB_contrast[:, :, 1], cleanIR),
                 np.maximum(TC_RGB_contrast[:, :, 2], cleanIR)])

        else:
            # The final RGB array, without CleanIR :)
            TC_RGB = TC_RGB_contrast

        # don't need the other file info or processing?
        if only_RGB:
            return TC_RGB

        # Create a color tuple for pcolormesh
        # Using one less column is very important,
        # else your image will be scrambled! (This is the strange nature of pcolormesh)
        TC_rgb = TC_RGB[:, :-1, :]
        # rgb = RGB[:,:,:] # Other times you need all the columns. Not sure why???
        TC_rgb = np.minimum(TC_rgb, 1)  # Force the maximum possible RGB value to be 1 (the lowest should be 0).
        TC_colorTuple = TC_rgb.reshape((TC_rgb.shape[0] * TC_rgb.shape[1]),
                                       3)  # flatten array, because that's what pcolormesh wants.
        TC_colorTuple = np.insert(TC_colorTuple, 3, 1.0,
                                  axis=1)  # adding an alpha channel will plot faster?? according to stackoverflow.


        return {'TrueColor': TC_RGB,
                'file': self.fileName,
                'rgb_tuple': TC_colorTuple}


    def GOES_composite(self):
        """
        Uses Channel 7, 6, 5, to create a "True Color" image.
        Recipe from Chad Gravelle (chad.gravell@noaa.gov)
        Input:
            FILE - name of the netcdf file. Must be the multiband formatted data file.
                   i.e. OR_ABI-L2-MCMIPC-M3_G16_s20172651517227_e20172651520000_c20172651520109.nc
            only_RGB - if True, only returns the RGB value, and not the additional details
        """
        # Open the file
        try:
            C = self.data
        except:
            print("Can't open file:", self.fileName)
            return None

        # Load the RGB arrays
        R = C['CMI_C07'][:].data  # Band 7 is red (0.3.9 um, shortwave)
        G = C['CMI_C06'][:].data  # Band 6 is "green" (0.2.2 um, cloud particle)
        B = C['CMI_C05'][:].data  # Band 5 is blue (0.1.6 um, snow/ice)

        # Turn empty values in nans (empty space in top left of figure)
        try:
            R[R == -1] = np.nan
            R[R == 65535] = np.nan

            B[B == -1] = np.nan
            B[B == 65535] = np.nan

            G[G == -1] = np.nan
            G[G == 65535] = np.nan
        except:
            print("AGAIN, WE HAVE A nan ISSUE")

        R_fire = R  # Could be used as a first test for active fires in Red channel

        # Normalize each channel by the appropriate range of values
        #                       RED 	                 GREEN 	              BLUE
        # Name 	            Shortwave Window 	Cloud Partilce Size 	Snow/Ice
        # Wavelength 	        3.9 µm 	                2.2 µm 	             1.6 µm
        # Channel 	            7 	                     6 	                  5
        # Units 	       Temperature (K) 	           Reflectance 	      Reflectance
        # Range of Values 	  273.15-333.15 	        0-1 	            0-1
        # Gamma Correction 	    0.4 	                none 	            none

        # Normalize each channel by the appropriate range of values  e.g. R = (R-minimum)/(maximum-minimum)
        R = (R - 273) / (360 - 273)
        G = (G - 0) / (1 - 0)
        B = (B - 0) / (0.75 - 0)

        # Apply range limits for each channel. RGB values must be between 0 and 1
        R = np.clip(R, 0, 1)
        G = np.clip(G, 0, 1)
        B = np.clip(B, 0, 1)

        # Apply the gamma correction to Red channel.
        #   corrected_value = value^(1/gamma)
        gamma = 0.4
        R = np.power(R, 1 / gamma)

        # The final RGB array :)
        RGB = np.dstack([R, G, B])
        # FOR ALL OTHER PROJECTIONS WE NEED TO USE pcolormesh
        # Create a color tuple for pcolormesh
        # Using one less column is very important,
        # else your image will be scrambled! (This is the stange nature of pcolormesh)
        rgb = RGB[:, :-1, :]

        # flatten array, becuase that's what pcolormesh wants.
        colorTuple = rgb.reshape((rgb.shape[0] * rgb.shape[1]), 3)

        # adding an alpha channel will plot faster?? according to stackoverflow.
        colorTuple = np.insert(colorTuple, 3, 1.0, axis=1)

        true_color = self.GOES_truecolor()
        TC_colorTuple = true_color['rgb_tuple']
        TC_rgb = true_color['TrueColor']

        composite_R = np.maximum(R, TC_rgb[:, :, 0])
        composite_G = np.maximum(G, TC_rgb[:, :, 1])
        composite_B = np.maximum(B, TC_rgb[:, :, 2])

        composite_RGB = np.dstack([composite_R, composite_G, composite_B])

        # Create a color tuple for pcolormesh

        # Don't use the last column of the RGB array or else the image will be scrambled!
        # This is the strange nature of pcolormesh.
        composite_rgb = composite_RGB[:, :-1, :]

        # Flatten the array, becuase that's what pcolormesh wants.
        composite_colorTuple = composite_rgb.reshape((composite_rgb.shape[0] * composite_rgb.shape[1]), 3)

        # Adding an alpha channel will plot faster, according to Stack Overflow. Not sure why.
        composite_colorTuple = np.insert(composite_colorTuple, 3, 1.0, axis=1)

        self.FireTemp = {'rgb': rgb,
                         'file': self.fileName,
                         'rgb_tuple': colorTuple,
                         'rgb_composite': composite_colorTuple,
                         'R': R,
                         'R_band': composite_R,
                         'B_band': composite_B,
                         'G_band': composite_G
                         }

        return self.FireTemp


def contrast_correction(color, contrast):
    """
    Modify the contrast of an R, G, or B color channel
    See: # www.dfstudios.co.uk/articles/programming/image-programming-algorithms/image-processing-algorithms-part-5-contrast-adjustment/
    Input:
        C - contrast level
    """
    F = (259 * (contrast + 255)) / (255. * 259 - contrast)
    COLOR = F * (color - .5) + .5
    COLOR = np.minimum(COLOR, 1)
    COLOR = np.maximum(COLOR, 0)
    return COLOR

