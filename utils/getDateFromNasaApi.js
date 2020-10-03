async function getDateFromNasaApi(isoDate) {
  const [year, month, day] = isoDate.substr(0, 10)
    .split('-')
    .map(r => parseInt(r));

  let result = await fetch("https://api.nasa.gov/planetary/apod?api_key=" +
    `${apiKey}&date=${year}-${month}-${day}`)
    .then(checkRemainingRequests)
    .then(r => r.json())
    .then(r => {
      if (r.code || r.msg) {
        return null;
      } else if (
        r.hasOwnProperty('error') &&
        r.error.code === 'OVER_RATE_LIMIT'
      ) {
        console.error('Ran out of Rate of Requests!');
        return null;
      } else {
        return r;
      }
    })
    .catch(e => {
      console.error('error from APOD Nasa Fetch', e);
      return null;
    });

  return result;
}

export default getDateFromNasaApi;