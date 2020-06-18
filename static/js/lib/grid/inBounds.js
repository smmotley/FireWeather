/**
 * Check if a point is located in the latitude range of a given bounding box.
 * @param  {object} point  -
 * @param  {object} bounds  -
 * @return {boolean}  True if inside of the latitude range
 */
export function inLat(point, bounds) {
  const sw = bounds.southwest;
  const ne = bounds.northeast;

  return point.lat > sw.lat && point.lat < ne.lat;
}

/**
 * Check if a point is located in the longitude range of a given bounding box.
 * @param  {object} point  -
 * @param  {object} bounds  -
 * @return {boolean}  True if inside of the longitude range
 */
export function inLng(point, bounds) {
  const sw = bounds.southwest;
  const ne = bounds.northeast;
  const eastBound = point.lng < ne.lng;
  const westBound = point.lng > sw.lng;

  let inLong = eastBound && westBound;
  if (ne.lng < sw.lng) {
    inLong = eastBound || westBound;
  }

  return inLong;
}

/**
 * Checks if a point is located in a given bounding box.
 * @param  {object} point  -
 * @param  {object} bounds  -
 * @return {boolean}  True if inside of the bounding box
 */
export default function inBounds(point, bounds) {
  return inLat(point, bounds) && inLng(point, bounds);
}
