require('dotenv').config();
const download = require('image-downloader');
const sharp = require('sharp');

const sqlQueryPromise = require('./utils/sqlQueryPromise');
const sqlConnectPromise = require('./utils/sqlConnectPromise');
const sqlStatements = require('./utils/sqlStatements');
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
  const con = await sqlConnectPromise(sqlConfig)
  .catch(e => {
    console.error('sqlConnectPromise rejected', e);
  });

  if (con) {
    await sqlQueryPromise(con, sqlStatements.useDatabase)
    .catch(e => {
      console.error('sqlQueryPromise useDatabase rejected', e);
    });

    // try reading?
    const response = await sqlQueryPromise(con, sqlStatements.recentImageWithoutThumbnails)
    .catch(e => {
      console.error('sqlQueryPromise useTable rejected', e);
    });

    if (response.length < 1) {
      console.log('no queries returned!');
      con.end();
      return;
    }
    
    const url = response[0].url;
    const suffix = url.substring(url.lastIndexOf('.'));
    // make a unique file name based on url
    const newName = Buffer.from(url).toString('base64') + suffix;

    console.log('new name', newName);

    const imageOptions = {
      url,
      dest: `./images/${newName}`,         
      extractFilename: false
    }
     
    await download.image(imageOptions)
      .catch((err) => console.error('image error', err));

    await sharp(`./images/${newName}`)
      .resize(320, 240)
      .toFile(`./thumbnails/thumb_${newName}`, (err, info) => {
        if (err) {
          console.error('Error with making thumbnail', err);
        } else {
          console.log('thumnail success!', info);
        }
      });

    console.log('after thumbnail is made????');

    con.end();
    // you have to con.end() at some point...
  }
}

grabOriginalImage()
.catch(e => console.error('General Error', e));
