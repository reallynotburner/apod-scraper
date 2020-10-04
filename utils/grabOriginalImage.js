require('dotenv').config();
const download = require('image-downloader');
const sharp = require('sharp');

const sqlQueryPromise = require('./sqlQueryPromise');
const sqlConnectPromise = require('./sqlConnectPromise');
const sqlStatements = require('./sqlStatements');
const mySqlEndpoint = process.env.MYSQL_ENDPOINT;
const mySqlUser = process.env.MYSQL_USER;
const mySqlPassword = process.env.MYSQL_PASSWORD;
const sqlConfig = {
  host: mySqlEndpoint,
  user: mySqlUser,
  password: mySqlPassword,
};
const apiKey = process.env.NASA_API_KEY;

/*
  TODO:  
  This needs to get broken into separate functions.
  It's not really reusable in this form.
*/
async function grabOriginalImage(isoDate, mediaType, url) {
  let skip = false;
  const isImage = mediaType === 'image';
  const isVideo = mediaType === 'video';
  const isYoutube = isVideo && url && url.indexOf('youtube') > -1;
  const isVimeo = isVideo && url && url.indexOf('vimeo') > -1;
  const isUstream = isVideo && url && url.indexOf('ustream') > -1;
  const extension = url.substring(url.lastIndexOf('.'));
  const newName = `image_${isoDate}${extension}`;
  const newGifName = `image_${isoDate}.webp`;
  const sourceUrl = `./images/${newName}`
  const imageOptions = {
    url,
    dest: sourceUrl,
    extractFilename: false
  }

  isImage && await download.image(imageOptions)
    .catch((err) => {
      console.error('image download error', err);
    })

  // come up with a name for the thumbnail file
  const isGif = extension === '.gif';
  const thumbnailName = isGif ?
    `thumbnail_${newGifName}`
    :
    `thumbnail_${newName}`;

  // where the app expects thumbnails to be
  const storagePath = `../apod-app/public/thumbnails/${thumbnailName}`;
  // where the app can access them
  const appPath = `./thumbnails/${thumbnailName}`;

  // Convert original image into a thumbnail
  isImage && await sharpPromise(sourceUrl, storagePath, isGif)
    .then(m => console.log('thumbnail success!!', m.size))
    .catch((err) => {
      // when this errors increment the offset value, default 0
      // skip is a placeholder for a dynamic offset.
      skip = true;
      console.error('thumnail creation error', err);
    });

  let path = '';
  if (isImage) {
    path = skip ? './thumbnails/thumbnail_image_default.jpg' : appPath
  } else if (isYoutube) {
    path = './thumbnails/thumbnail_image_youtube_default.jpg'
  } else if (isVimeo) {
    path = './thumbnails/thumbnail_image_vimeo_default.jpg'
  } else if (isUstream) {
    path = './thumbnails/thumbnail_image_ustream_default.jpg'
  } else {
    path = './thumbnails/thumbnail_image_default.jpg'
  }

  // if errored give it the default thumbnail
  // otherwise udpate the record with location of thumbnail
  // await sqlQueryPromise(updateCon, sqlStatements.updateThumbnail(targetId, path))
  //   .catch(e => {
  //     console.error('sqlQueryPromise Write useDatabase rejected', e);
  //   });

  // updateCon.end();

  return path;
}

async function sharpPromise(sourceUrl, destinationUrl, isGif = false) {
  const gifOptions = isGif ? { animated: true } : undefined;
  return new Promise((resolve, reject) => {
    sharp(sourceUrl, gifOptions)
      .resize({ height: 200 })
      .toFile(destinationUrl, (err, info) => {
        if (err) {
          reject(err);
        } else {
          resolve(info);
        }
      });
  });
}

async function grabThemAll() {
  let errored = false;
  let iteration = 10000; // some sort of limit on daily requests.
  while (!errored && iteration > 0) {
    const result = await grabOriginalImage()
      .catch(e => {
        errored = true;
        console.error('General Error', e);
      });
    if (!result) {
      console.error('No result grabbed, will try again in 4 hours');
      errored = true;
      setTimeout(grabThemAll, 60 * 60 * 4 * 1000);
      break;
    }
    iteration--;
  }
}

async function grabOne() {
  const result = await grabOriginalImage(9238)
    .then(r => console.log('grab one result', r))
    .catch(e => {
      console.error('General Error', e);
    });
  return result;
}


module.exports = grabOriginalImage;
