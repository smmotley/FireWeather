import getStepSizes from './getStepSizes.js';
import {inLng, inLat} from './inBounds.js';
import wrapBounds from './wrapBounds.js';

/**
 * Calculates the maximum extent which needs to be sampled from the grid.
 * @param  {object} bbox  The bounding box of the grid
 * @param  {object} bounds  The current map bounds
 * @param  {number} height  The pixel height of the grid
 * @param  {number} width  The pixel width of the grid
 * @return {number[]}  The extent: [<max-x>, <max-y>]
 */
export function getPixelExtent(bbox, bounds, height, width) {
  const bboxExtent = {
    lng: bbox.northeast.longitude,
    lat: bbox.southwest.latitude
  };
  const boundsExtent = {
    lng: bounds.northeast.lng,
    lat: bounds.southwest.lat
  };
  const bboxInLng = inLng(bboxExtent, bounds);
  const bboxInLat = inLat(bboxExtent, bounds);
  const [stepX, stepY] = getStepSizes(bbox, height, width);
  const distLng = Math.abs(bboxExtent.lng - boundsExtent.lng);
  const distLat = Math.abs(bboxExtent.lat - boundsExtent.lat);

  let extentX = width;
  let extentY = height;

  if (!bboxInLng) {
    extentX = extentX - Math.floor(distLng / stepX);
  }

  if (!bboxInLat) {
    extentY = extentY - Math.floor(distLat / stepY);
  }

  return [extentX, extentY];
}

/**
 * Calculates the starting coordinates for the grid sampling.
 * @param  {object} bbox  The bounding box of the grid
 * @param  {object} bounds  The current map bounds
 * @param  {number} height  The pixel height of the grid
 * @param  {number} width  The pixel width of the grid
 * @return {number[]}  The origin: [<min-x>, <min-y>]
 */
export function getPixelOrigins(bbox, bounds, height, width) {
  const bboxOrigin = {
    lng: bbox.southwest.longitude,
    lat: bbox.northeast.latitude
  };
  const boundsOrigin = {
    lng: bounds.southwest.lng,
    lat: bounds.northeast.lat
  };
  const bboxInLng = inLng(bboxOrigin, bounds);
  const bboxInLat = inLat(bboxOrigin, bounds);
  const [stepX, stepY] = getStepSizes(bbox, height, width);
  const distLng = Math.abs(bboxOrigin.lng - boundsOrigin.lng);
  const distLat = Math.abs(bboxOrigin.lat - boundsOrigin.lat);

  let originX = 0;
  let originY = 0;

  if (!bboxInLng) {
    originX = Math.floor(distLng / stepX);
  }

  if (!bboxInLat) {
    originY = Math.floor(distLat / stepY);
  }

  return [originX, originY];
}

/**
 * Calculates the bounds of the grid area which needs to be sampled.
 * @param  {object} bbox  The bounding box of the grid
 * @param  {object} bounds  The current map bounds
 * @param  {number} height  The pixel height of the grid
 * @param  {number} width  The pixel width of the grid
 * @return {array[]}  The bounds: [<min-x>, <min-y>, <max-x>, <max-y>]
 */
export default function getPixelBounds(bbox, bounds, height, width) {
  if (Math.abs(bounds.southwest.lng - bounds.northeast.lng) >= 360) {
    return [0, 0, width, height];
  }

  const wrappedBounds = wrapBounds(bounds);
  return [
    ...getPixelOrigins(bbox, wrappedBounds, height, width),
    ...getPixelExtent(bbox, wrappedBounds, height, width)
  ];
}
