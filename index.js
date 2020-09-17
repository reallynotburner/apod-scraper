var mysql = require('mysql');
require('dotenv').config();
const fetch = require('isomorphic-fetch');

const mySqlEndpoint = process.env.MYSQL_ENDPOINT;
const mySqlUser = process.env.MYSQL_USER;
const mySqlPassword = process.env.MYSQL_PASSWORD;
const mySqlDatabase = process.env.MYSQL_DATABASE;
const sqlConfig = {
  host: mySqlEndpoint,
  user: mySqlUser,
  password: mySqlPassword,
  database: mySqlDatabase
};
const apiKey = process.env.NASA_API_KEY;

async function scrapeApod(apiKey, offset = 1) {
  let apiRequestsRemaining = 2000; // default daily quota, updated from server
  let errored = false;
  const cursorDate = new Date();
  const stopDate = new Date();
  const [stopYear, stopMonth, stopDay] = stopDate
    .toISOString()
    .substr(0, 10).split('-').map(r => parseInt(r));

  let cursorYear, cursorMonth, cursorDay;

  const con = await sqlConnectPromise(sqlConfig);
  if (!con) throw 'Bad MySQL Connection';
  
  const recentDateSql = `SELECT DATE_FORMAT(date,\'%Y-%m-%d\') date from ApodApiRecords ORDER by id DESC LIMIT 1`;
  const recentDateResult = await sqlQueryPromise(con, recentDateSql);

  if (recentDateResult.length > 0) {
    // this looks weird, but the date object returned is pretty strange,
    // that's why I'm requesting it be formatted above
    [ cursorYear, cursorMonth, cursorDay ] = recentDateResult[0].date.split('-').map(r => parseInt(r));
  } else {
    // case where there is No items in table, choose the day before first day of data
    cursorYear = 1995;
    cursorMonth = 6;
    cursorDay = 15;
  }

  cursorDate.setFullYear(cursorYear);
  cursorDate.setMonth(cursorMonth);
  cursorDate.setDate(cursorDay + offset);

  cursorYear = cursorDate.getFullYear();
  cursorMonth = cursorDate.getMonth();
  cursorDay = cursorDate.getDate();

  if (
    cursorYear > stopYear ||
    cursorYear === stopYear && cursorMonth > stopMonth ||
    cursorYear === stopYear && cursorMonth === stopMonth && cursorDay > stopDay
  ) {
    // this is where a timed job would be nice, to kick off 
    console.log('cursor date is greater than current date');
    con.end();
  } else {
    try {
      fetch("https://api.nasa.gov/planetary/apod?api_key=" +
      `${apiKey}&date=${cursorYear}-${cursorMonth}-${cursorDay}`)
      .then(r => {
        apiRequestsRemaining = parseInt(r.headers._headers['x-ratelimit-remaining'][0]);
        console.log('requests remaining', apiRequestsRemaining);
        return r;
      })
      .then(r => r.json())
      .then(r => {
        if (r.code || r.msg) {
          offset = offset + 1;
          return `SELECT * from ApodApiRecords LIMIT 0`;
        } else if (
          r.hasOwnProperty('error') &&
          r.error.code === 'OVER_RATE_LIMIT'
        ) {
          errored = true;
          throw 'Ran out of Rate of Requests!';
        }
  
        if (apiRequestsRemaining < 100) { // Give a margin, don't want to get flagged or something
          errored = true;
          throw 'Ran out of Number of requests!';
        }
        offset = 1;
        const sql = `INSERT INTO ApodApiRecords (date, title, media_type, url, hdurl, explanation, copyright) ` +
          `VALUES (${con.escape(r.date)},` +
          ` ${con.escape(r.title && r.title)},` +
          `  ${con.escape(r.media_type && r.media_type)},` +
          `  ${con.escape(r.url && r.url)},` +
          `  ${con.escape(r.hdurl && r.hdurl)},` +
          `  ${con.escape(r.explanation && r.explanation.substr(0, 2047))},` +
          `  ${con.escape(r.copyright && r.copyright.substr(0, 63))})`;
        return sql;
      })
      .then(sql => sqlQueryPromise(con, sql))
      .then(() => {
        if (!errored) {
          scrapeApod(apiKey, offset);
        } else { // try in an hour
          console.log('will try again in an hour+');
          setTimeout(() => {
            scrapeApod(apiKey, offset);
          }, 4000000);
        }
      })
      .catch(e => console.error('ERROR', e))
      .finally(() => con.end());

    } catch (e) {
      con.end();
    }
  }
  
}

function sqlConnectPromise(config) {
  return new Promise((resolve, reject) => {
    try {
      const con = mysql.createConnection(config);
      con.connect(err => {
        if (err) {
          reject(null);
        } else {
          resolve(con);
        }
      });
    } catch (e) {
      reject(null);
    }
  });
}

async function sqlQueryPromise(con, sql) {
  return new Promise((resolve, reject) => {
    try {
      con.query(sql, function (err, result) {
        if (err) {
          reject(null);
        } else {
          resolve(result);
        }
      });
    } catch (e) {
      reject(null);
    }
  });
  
}

scrapeApod(apiKey);


// Thumbnail Function
/*
  Connect to APOD database
  - check results table:
  - what is the most recent date with thumbnail created successfully
  ** complexity here!  Some content is not image, and will not have an
    obvious source of thumbnail: unless we get really fancy and construct
    thumbnails from videos.  So good record may not have thumbnail
    media_type === 'image' because it is a Video.
  -%%% what is the last date in the APOD database, that is STOP date.
  - increment date and query APOD history for that date.
  - if date > stop date, stop.
  - if media_type === 'image' attempt to download image and get MIME type
  - construct filename: {basePath to deploy image}/APOD_thumbnail_1995-06-16.{MIME type}
  - resize according to appropriate algorithm, save and deploy.
  - update an IN PROGRESS table with the job of input url, output thumbnail url.
  - FOR NOW: if Video, let's have thumnail point to static image "VideoThumbnail.png"
    that has a little play button on it to entice clicking"
    And make a default thumbnail if we don't know what to do with the MIME type.
  - go to -%%% to repeat.

 */

 // Thumbnail Cleanup
/*
 After all that thumbnail stuff.
 We have go to heck THUMBNAIL IN PROGRESS table for all the stuff it's deploying.
 Attempt to download each output thumnail url.  If good, delete the source image
 from the thumbnail working directory.  Remove the row.
*/
