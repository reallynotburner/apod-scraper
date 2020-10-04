require('dotenv').config();
const grabOriginalImage = require('./utils/grabOriginalImage');
const getApodApiResonse = require('./utils/getApodApiResponse');
const getMostRecentScrapedDate = require('./utils/getMostRecentScrapedDate');
const insertApiDataIntoTable = require('./utils/insertApiDataIntoTable');

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