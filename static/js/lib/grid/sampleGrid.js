import getPixelBounds from './getPixelBounds.js';
import getStepSizes from './getStepSizes.js';


/**
 * Calculates the sampling rates in x and y direction based on the grid
 *  dimensions and the zoom level.
 * @param  {number} height  Grid height
 * @param  {number} width  Grid width
 * @param  {number} zoom  Current zoom value
 * @param  {number} samplingFactor  The configurable sampling factor
 * @return {array.<number>}  The sampling rates: [x, y]
 */
function getSamplingRates(height, width, zoom, samplingFactor) {
  const zoomScale = Math.pow(2, Math.floor(zoom));
  //const zoomScale = samplingFactor

  const samplingRateX = Math.floor(1 / (zoomScale * samplingFactor) * width);
  const samplingRateY = Math.floor(1 / (zoomScale * samplingFactor) * height);

  return [Math.max(samplingRateX, 1), Math.max(samplingRateY, 1)];
}

/**
 * Creates the GeoJSON properties object by looking up the weather parameters
 *   from multiple grids.
 * @param  {array.<object>} gridData  The grids
 * @param  {number} index  The index to of the pixel to look up (1D)
 * @param  {object} valueMappingTables  The value mappings for every weather
 *   parameter.
 * @return {object}  The GeoJSON properties object
 */
function getProperties(gridData, index) {
  const weatherParameters = {};
  gridData.forEach(grid => {
    const colorValue = grid.data[index];

    weatherParameters[grid.weatherParameter] = colorValue;
  });

  return {
    weatherParameters
  };
}

/**
 * Creates a point feature from coordinates and properties.
 * @param  {array} coordinates  [lng, lat]
 * @param  {object} properties  -
 * @return {object}  A valid GeoJSON Point Feature
 */
function createFeature(coordinates, properties) {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates
    },
    properties
  };
}

/** NEW ADDED BY SMOTLEY
 * Creates a polygon feature from coordinates and properties for 3D rendering.
 * @param  {array} coordinates  [lng, lat]
 * @param  {object} properties  -
 * @return {object}  A valid GeoJSON Point Feature
 */
function create3dFeature(coordinates, properties) {
    return {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates
        },
        properties
    };
}

/**
 * Samples multiple grids to generate GeoJSON features.
 * @param  {object} gridData  The gridData
 *   @param  {array.<object>} gridData.grid  Multiple pixel grids
 *   @param  {object} gridData.bbox  The bounding box of the the grids
 * @param  {object} mapState  -
 *   @param  {object} mapState.bounds  The current map bounds
 *   @param  {number} mapState.zoom  The current (floored) map zoom
 * @param  {number} samplingFactor  The configurable sampling factor
 * @return  {array.<object>}  An array of GeoJSON features
 */
//export default function sampleGrid(gridData, mapState, samplingFactor) { //SMOTLEY
export function sampleGrid(gridData, mapState, samplingFactor) {
  const {bbox, grid} = gridData;
  const {bounds, zoom} = mapState;

  const geoJsonFeatures = grid.map(pixelWithParams => {
    const {height, width} = pixelWithParams;

    const [lngStep, latStep] = getStepSizes(bbox, height, width);
    const [sampleStepX, sampleStepY] = getSamplingRates(
      height,
      width,
      zoom,
      samplingFactor
    );

    const [originX, originY, extentX, extentY] = getPixelBounds(
      bbox,
      bounds,
      height,
      width
    );
    const minX = originX - originX % sampleStepX;
    const minY = originY - originY % sampleStepY;

    const features = [];
    for (let y = minY; y < extentY; y += sampleStepY) {
      for (let x = minX; x < extentX; x += sampleStepX) {
        const lat = bbox.northeast.latitude - y * latStep;
        const lng = bbox.southwest.longitude + x * lngStep;

        const properties = getProperties(
          grid,
          x + y * width // the index into the 1D pixel array
        );

        features.push(createFeature([lng, lat], properties));
      }
    }

    return features;
  });

  return [].concat(...geoJsonFeatures);
}


/**ADDED BY SMOTLEY --> For creating 3d polygon
 * Samples multiple grids to generate GeoJSON features.
 * @param  {object} gridData  The gridData
 *   @param  {array.<object>} gridData.grid  Multiple pixel grids
 *   @param  {object} gridData.bbox  The bounding box of the the grids
 * @param  {object} mapState  -
 *   @param  {object} mapState.bounds  The current map bounds
 *   @param  {number} mapState.zoom  The current (floored) map zoom
 * @param  {number} samplingFactor  The configurable sampling factor
 * @return  {array.<object>}  An array of GeoJSON features
 */
export default function sample3dGrid(gridData, mapState, samplingFactor) {
    const {bbox, grid} = gridData;
    const {bounds, zoom} = mapState;

    const geoJsonFeatures = grid.map(pixelWithParams => {
        const {height, width} = pixelWithParams;

        const [lngStep, latStep] = getStepSizes(bbox, height, width);
        const [sampleStepX, sampleStepY] = getSamplingRates(
            height,
            width,
            zoom,
            samplingFactor
        );

        const [originX, originY, extentX, extentY] = getPixelBounds(
            bbox,
            bounds,
            height,
            width
        );
        const minX = originX - originX % sampleStepX;
        const minY = originY - originY % sampleStepY;

        const features = [];
        for (let y = minY; y < extentY; y += sampleStepY) {
            for (let x = minX; x < extentX; x += sampleStepX) {
                const lat = bbox.northeast.latitude - y * latStep;  //upper left (NW side) of each polygon
                const lng = bbox.southwest.longitude + x * lngStep; //upper left (NW side) of each polygon

                const urlat = lat;  //upper right (NE side) of each polygon
                const urlng = lng + lngStep;

                const lrlat = lat - latStep;  //lower right (SE side) of each polygon
                const lrlng = lng + lngStep;

                const lllat = lat - latStep;  //lower left (SW side) of each polygon
                const lllng = lng;





                const properties = getProperties(
                    grid,
                    x + y * width // the index into the 1D pixel array
                );

                features.push(create3dFeature([[[lng, lat],[urlng, urlat],[lrlng, lrlat],[lllng, lllat]]], properties));
            }
        }

        return features;
    });

    return [].concat(...geoJsonFeatures);
}
