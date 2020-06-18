/**
 * Calculate the step size for calculating pixel coordinates to lat/lng coords.
 * @param  {object} bbox  The bounding box
 * @param  {number} height  -
 * @param  {number} width  -
 * @return {object}  The step sizes: {stepX: <number>, stepY: <number>}
 */
export default function getStepSizes(bbox, height, width) {
  const maxX = bbox.northeast.longitude;
  const maxY = bbox.southwest.latitude;
  const minX = bbox.southwest.longitude;
  const minY = bbox.northeast.latitude;

  return [Math.abs(minX - maxX) / width, Math.abs(minY - maxY) / height];
}

