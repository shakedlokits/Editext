var Jimp = require('jimp');

// const image = sharp(
//   '/Users/shakedlokits/Documents/Projects/BookOCR-toRemove/images/book_001.jpg',
// );
// image.metadata().then((metadata) => {
//   image.extract({
//     left: 0,
//     top: 0,
//     width: Math.round(metadata.width / 2),
//     height: metadata.height,
//   }).toFile('/tmp/image0.pg', (err) => {
//     // Extract a region, resize, then extract from the resized image
//   });
// });

const base = '/Users/shakedlokits/Desktop/imageTests/'
const imagePath = '/Users/shakedlokits/Documents/Projects/BookOCR-toRemove/images/book_001.jpg';

// open a file called "lenna.png"
Jimp.read(imagePath, (err, image) => {
  if (err) throw err;

  const height = image.bitmap.height;
  const halfWidth = Math.floor(image.bitmap.width / 2);

  image
    .clone()
    .crop(0, 0, halfWidth, height)
    .write(base + 'left.jpg');
  image
    .clone()
    .crop(halfWidth, 0, halfWidth, height)
    .write(base + 'right.jpg');
});
