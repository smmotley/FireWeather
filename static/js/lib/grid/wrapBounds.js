/**
 * Wraps a given point into -180..180 longitude range.
 * @param  {object} point  -
 *   @param {number}  point.lat  -
 *   @param {number}  point.lng  -
 * @return {object}  The wrapped point
 */
function wrapLngLat(point) {
  const lngLat = new mapboxgl.LngLat(point.lng, point.lat).wrap();

  return {
    lat: lngLat.lat,
    lng: lngLat.lng
  };
}

/**
 * Wraps northeast and southwest coords of bounds into -180..180 longitude
 *   range.
 * @param  {object} bounds  -
 * @return {object}  The wrapped bounds
 */
export default function wrapBounds(bounds) {
  return {
    northeast: {
      ...wrapLngLat(bounds.northeast)
    },
    southwest: {
      ...wrapLngLat(bounds.southwest)
    }
  };
}
