import * as gridUtils from './grid-utils.js';
import sampleGrid from './sampleGrid.js';
import sample3dGrid from "./sampleGrid.js";

/**
 * Creates a valid GeoJSON FeatureCollection from an array of features.
 * @param  {array} features  The features
 * @return {object}  The GeoJSON FeatureCollection
 * @private
 */
function createGeoJsonData(features = []) {
  return {
    type: 'FeatureCollection',
    features
  };
}

const cache = {};

/**
 * A data loader to fetch images and convert them to grids.
 */
export default class GridDataLoader {
  /**
   * Queries grid data.
   * @param  {object} metaData  The metadata for the query
   * @param  {QueryOptions} options  The query options
   * @return {Promise.<object>}  A Promise which resolves with GeoJSON data
   *   sampled from the grid
   */
  queryData(images, options) {
      const {bbox, bounds, samplingFactor, zoom} = options;

      const queryGrids = images.map(image => {
          const {url, weatherParameter, imageType} = image;
          const queryGrid = this._executeQuery(url, weatherParameter, imageType);

          return queryGrid;
      });

      return Promise.all(queryGrids)
      .then(gridData => {
        //const features = sampleGrid(
          const features = sample3dGrid( //added by SMOTLEY
          {
            grid: gridData,
            bbox
          },
          {
            bounds,
            zoom
          },
          samplingFactor
        );

        return features;
      })
      .then(createGeoJsonData);
  }

    /**
     * Queries tile and gets pixel information.
     * @param  {object} images The tile (png) for the query
     * @param  {QueryOptions} options  The query options
     * @return {Promise.<object>}  A Promise which resolves with pixel data from a 256*256 tile
     *   sampled from the grid
     */
    queryPixels(images, options) {
        const queryGrids = images.map(image => {
            const {url, weatherParameter, imageType} = image;
            const queryGrid = this._executeQuery(url, weatherParameter, imageType);

            return queryGrid;
        });
        return Promise.all(queryGrids)
    }

  /**
   * Queries the grid data for a given url.
   * @param  {string} url  The url for the grid image
   * @param  {string} weatherParameter  The name of the weather parameter
   *   represented by the grid
   * @param  {string} imageType  Grayscale or Color image
   * @return {Promise.<object>}  The grid
   * @private
   */
  _executeQuery(url, weatherParameter, imageType) {
    return new Promise((resolve, reject) => {
      this._fetchData(url)
        // convert the image (from the url resulting from fetch Data) Image to ImageData
        .then(gridUtils.imageToBitmap)
        // convert ImageData to grid object
        .then(bitmap => ({
          data: gridUtils.imageDataToPixels(bitmap, imageType),
          height: bitmap.height,
          width: bitmap.width,
          weatherParameter
        }))
        // cache the grid and return it
        .then(resolve)
        .catch(error => reject(error));
    });
  }

  /**
   * Fetches an Image from either cache or network.
   * @param  {string} url  The image url
   * @return {Promise.<Image>}  The image
   */
  _fetchData(url) {
    if (cache[url]) {
      return Promise.resolve(cache[url]);
    }

    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';

      image.addEventListener('error', reject);
      image.addEventListener('load', () => {
        cache[url] = image;
        resolve(image);
      });

      image.src = url;
    });
  }
}

/**
 * The options used to query data
 * @typedef {object} QueryOptions
 * @property {object} bounds  The current map bounding box
 * @property {boolean} shouldSample  Indicate if the the grid should be sampled
 *   even if the timestamp did not change
 * @property {number} lastTimestamp  The last timestamp of the timeseries which
 *   was queried
 * @property {number} referenceTime  The current time to query for
 * @property {number} samplingFactor  The factor used for sampling the grid
 * @property {number} zoom  The current map zoom
 */
