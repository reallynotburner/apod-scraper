require('dotenv').config();
const fetch = require('isomorphic-fetch');
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

module.exports = getApodApiResonse;