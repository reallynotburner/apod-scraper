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

async function grabOriginalImage() {
  let skip = false;
  const con = await sqlConnectPromise(sqlConfig)
    .catch(e => {
      console.error('sqlConnectPromise rejected', e);
    });

  if (!con) {
    throw 'grabOriginalImage No MySQL connection';
  }

  await sqlQueryPromise(con, sqlStatements.useDatabase)
    .catch(e => {
      console.error('sqlQueryPromise useDatabase rejected', e);
    });

  const response = await sqlQueryPromise(con, sqlStatements.recentImageWithoutThumbnails)
    .catch(e => {
      console.error('sqlQueryPromise useTable rejected', e);
    });

  con.end();

  if (response.length < 1) {
    throw 'no queries returned!';
  }

  const { url, id, date } = response[0];

  const extension = url.substring(url.lastIndexOf('.'));
  const newName = `image_${date}${extension}`;
  const newGifName = `image_${date}.webp`;
  const sourceUrl = `./images/${newName}`
  const imageOptions = {
    url,
    dest: sourceUrl,
    extractFilename: false
  }

  await download.image(imageOptions)
    .catch((err) => {
      console.error('image download error', err);
    })

  const isGif = extension === '.gif';
  const thumbnailUrl = isGif ?
    `./thumbnails/thumbnail_${newGifName}`
    :
    `./thumbnails/thumbnail_${newName}`;


  await sharpPromise(sourceUrl, thumbnailUrl, isGif)
    .then(m => console.log('thumbnail success!!', m.size))
    .catch((err) => {
      // when this errors increment the offset value, default 0
      // skip is a placeholder for a dynamic offset.
      skip = true;
      console.error('thumnail creation error', err);
    });

  const updateCon = await sqlConnectPromise(sqlConfig)
    .catch(e => {
      console.error('sqlConnectPromise rejected', e);
    });

  if (!updateCon) {
    throw 'grabOriginalImage No MySQL connection';
  }

  await sqlQueryPromise(updateCon, sqlStatements.useDatabase)
    .catch(e => {
      console.error('sqlQueryPromise Write useDatabase rejected', e);
    });

  /*
    TODO: update such that there's a notion of offset, if it's skipped, select the next one
    that's null, and so forth.  With this as-is, I have to go back and update thumbnailUrl back
    to null with SQL statements.
  */
  await sqlQueryPromise(updateCon, sqlStatements.updateThumbnail(id, skip ? './thumbnails/thumbnail_image_default.jpg' : thumbnailUrl))
    .catch(e => {
      console.error('sqlQueryPromise Write useDatabase rejected', e);
    });

  updateCon.end();

  return true;
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
  let iteration = 0;
  while (!errored && iteration < 10000) {
    const result = await grabOriginalImage()
      .catch(e => {
        errored = true;
        console.error('General Error', e);
      });
    if (!result) {
      errored = true;
    }
    iteration++;
  }
}

async function grabOne() {
  const result = await grabOriginalImage()
    .then(r => console.log('grab one result', r))
    .catch(e => {
      console.error('General Error', e);
    });
  return result;
}

grabThemAll()
  .then(r => console.log('grab one result', r))
  .catch(e => console.error('grab one error', e));