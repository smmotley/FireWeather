/**
 * Generates the raw image data from a given Image element.
 * @param  {Image} image  The image
 * @return {ImageData}  -
 */
function getImageData(image) {
  const canvas = document.createElement('canvas');
  canvas.height = image.height;
  canvas.width = image.width;

  const context = canvas.getContext('2d');

  context.drawImage(image, 0, 0);

  return context.getImageData(0, 0, image.width, image.height);
}

/**
 * Converts an Image to ImageData.
 * @param  {Image} image  The image
 * @return {ImageData}  The converted image
 */
export function imageToBitmap(image) {
  return Promise.resolve(getImageData(image));
}

/**
 * Retrieves the single grey scale values from image data.
 * @param  {ImageData} imageData  -
 * @param  {string} imageType whether image is color or grayscale
 * @return {Uint8Array}  Containing 1 grey value per pixel or 4 rgba per pixel if color
 */
export function imageDataToPixels(imageData, imageType) {
  const {data} = imageData;
  const {height, width} = imageData;
  const pixels = new Uint8Array(height * width);

  for (let i = 0, len = data.length; i < len; i += 4) {
     const red = data[i];
     const green = data[i + 1];
     const blue = data[i + 2];
     const alpha = data[i + 3];

     // imgData.data[i+0] = red;
     // imgData.data[i+1] = green;
    //  imgData.data[i+2] = blue;
     // imgData.data[i+3] = alpha;
      //pixels[i / 4] = (red+blue+green)/3;
   pixels[i / 4] = data[i];
  }

   // ctx.putImageData(imgData, 10, 10);
    if (imageType==='rgba') return data

    return pixels;
}
