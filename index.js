require('dotenv').config();
const fetch = require('isomorphic-fetch');
const createDbAndTableIfNecessary = require('./utils/createDbAndTableIfNecessary');
const sqlQueryPromise = require('./utils/sqlQueryPromise');
const sqlConnectPromise = require('./utils/sqlConnectPromise');
const sqlStatements = require('./utils/sqlStatements');
const grabOriginalImage = require('./utils/grabOriginalImage');
const mySqlEndpoint = process.env.MYSQL_ENDPOINT;
const mySqlUser = process.env.MYSQL_USER;
const mySqlPassword = process.env.MYSQL_PASSWORD;
const sqlConfig = {
  host: mySqlEndpoint,
  user: mySqlUser,
  password: mySqlPassword,
};
const apiKey = process.env.NASA_API_KEY;

async function getApodApiResonse(date) {
  const isoDate = date.toISOString().substr(0, 10);
  const apiResponse = await fetch(`https://api.nasa.gov/planetary/apod` +
    `?api_key=${apiKey}&date=${isoDate}`)
    .catch(e => {
      console.error('Error during api call', e);
      return null;
    });

  let apiHourlyRequestsRemaining;
  try {
    apiHourlyRequestsRemaining = parseInt(apiResponse.headers._headers['x-ratelimit-remaining'][0]);
  } catch {
    apiHourlyRequestsRemaining = null;
  }

  let jsonResult;
  try {
    jsonResult = await apiResponse.json();
    jsonResult.apiHourlyRequestsRemaining = apiHourlyRequestsRemaining;
  } catch {
    jsonResult = null;
  }

  return jsonResult;
}

async function getMostRecentScrapedDate() {
  let cursorDate = new Date('1995-06-15');
  let errored = false;

  const con = await sqlConnectPromise(sqlConfig).catch(e => {
    errored = true;
  });

  const isGoodDataBase = await createDbAndTableIfNecessary(con).catch(e => {
    errored = true;
  });

  if (errored || !con) {
    return null;
  }

  const recentDateResult = await sqlQueryPromise(con, sqlStatements.getLatestRecord).catch(e => {
    errored = true;
  });

  if (recentDateResult.length > 0) {
    cursorDate = new Date(recentDateResult[0].date);
    console.log('most recent date', cursorDate);
  }

  con && con.end();

  return cursorDate;
}

async function insertApiDataIntoTable(record) {
  let errored = false;

  const con = await sqlConnectPromise(sqlConfig).catch(e => {
    errored = true;
  });

  await sqlQueryPromise(con, sqlStatements.useDatabase).catch(e => {
    errored = true;
  });

  if (errored || !con) {
    throw 'Bad MySQL Connection!';
  }

  const sql = sqlStatements.insertNewApodRecord(con, record);
  await sqlQueryPromise(con, sql);
  con && con.end();
}

async function scrape() {
  const stopDate = new Date();
  let stopTime = stopDate.getTime();
  let cursorDate = new Date();
  let cursorTime = cursorDate.getTime();
  let errored = false;
  let hourlyRateLimited = false;

  // gets the initial date
  const recentDate = await getMostRecentScrapedDate();
  if (recentDate) {
    cursorDate = recentDate;
    cursorTime = cursorDate.getTime();
  } else if (recentDate === null) {
    errored = true;
  }

  while (cursorTime < stopTime && !errored) {
    cursorDate.setDate(cursorDate.getDate() + 1);
    cursorTime = cursorDate.getTime();

    const apiResult = await getApodApiResonse(cursorDate);
    const {
      msg,
      code,
      media_type,
      date,
      url,
      apiHourlyRequestsRemaining
    } = apiResult;

    if (!apiHourlyRequestsRemaining || apiHourlyRequestsRemaining < 10) break;
    if (msg || code) continue;

    // if we are here, we should have a good record to store.
    const resultImagePath = await grabOriginalImage(date, media_type, url).catch(e => {
      console.error('error getting thumbnail path', e);
      return null;
    });
    apiResult.thumbnailUrl = resultImagePath;
    await insertApiDataIntoTable(apiResult);
  }

  if (hourlyRateLimited) {
    setTimeout(scrape, 75 * 60 * 1000);
    console.log( 'Will try again in about an hour' );
  } else {
    setTimeout(scrape, 60 * 60 * 24 * 1000);
    console.log( 'Will try again in 24 hours' );
  }
}

scrape();