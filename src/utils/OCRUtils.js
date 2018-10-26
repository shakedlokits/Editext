import path from 'path';
import fs from 'fs';

export function parseFile(imagePath, callback, progress) {
  console.group('Parsing file.');
  Tesseract.recognize(imagePath, { lang: 'heb' })
  .progress(progress).then(callback).finally(() => {
    console.groupEnd();
    progress(null);
  });
}

export function getNameFromPath(address) {
  return address.split('\\').pop().split('/').pop();
}

export function writeToFile(path, text) {
  fs.writeFile(path, text, (err) => {
    if (err) {
      return console.log(err);
    }
  });
}
