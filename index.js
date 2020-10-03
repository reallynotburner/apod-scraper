require('dotenv').config();
const fetch = require('isomorphic-fetch');
const createDbAndTableIfNecessary = require('./utils/createDbAndTableIfNecessary');
const sqlQueryPromise = require('./utils/sqlQueryPromise');
const sqlConnectPromise = require('./utils/sqlConnectPromise');
const checkRemainingRequests = require('./utils/checkRemainingRequests');
const sqlStatements = require('./utils/sqlStatements');
const mySqlEndpoint = process.env.MYSQL_ENDPOINT;
const mySqlUser = process.env.MYSQL_USER;
const mySqlPassword = process.env.MYSQL_PASSWORD;
const mySqlDatabaseName = process.env.MYSQL_DATABASE;
const mySqlTableName = process.env.MYSQL_TABLE;
const sqlConfig = {
  host: mySqlEndpoint,
  user: mySqlUser,
  password: mySqlPassword,
};
const apiKey = process.env.NASA_API_KEY;

async function scrapeApod(apiKey, offset = 1) {
  let errored = false;
  const cursorDate = new Date();
  const stopDate = new Date();
  const [stopYear, stopMonth, stopDay] = stopDate
    .toISOString()
    .substr(0, 10).split('-').map(r => parseInt(r));

  let cursorYear, cursorMonth, cursorDay;

  const con = await sqlConnectPromise(sqlConfig).catch(e => {
    errored = true;
  })

  if (errored || !con) {
    throw 'Bad MySQL Connection!';
  }

  const isGoodDataBase = await createDbAndTableIfNecessary(con);
  if (!isGoodDataBase) throw 'Bad MySQL Database!';

  const recentDateResult = await sqlQueryPromise(con, sqlStatements.getLatestRecord);

  if (recentDateResult.length > 0) {
    // this looks weird, but the date object returned is pretty strange,
    // that's why I'm requesting it be formatted above
    [cursorYear, cursorMonth, cursorDay] = recentDateResult[0].date.split('-').map(r => parseInt(r));
  } else {
    // case where there is No items in table, choose the day before first day of data
    cursorYear = 1995;
    cursorMonth = 6;
    cursorDay = 15;
  }


  cursorDate.setFullYear(cursorYear);
  cursorDate.setMonth(cursorMonth - 1);
  cursorDate.setDate(cursorDay + offset);

  cursorYear = cursorDate.getFullYear();
  cursorMonth = cursorDate.getMonth() + 1;
  cursorDay = cursorDate.getDate();

  // TODO: learn date comparison / manipulation patters.
  // until now, I've only used Date.now() to see what the 
  // process times look like in millis.
  if (
    cursorYear > stopYear ||
    cursorYear === stopYear && cursorMonth > stopMonth ||
    cursorYear === stopYear && cursorMonth === stopMonth && cursorDay > stopDay
  ) {
    // this is where a timed job would be nice, to kick off 
    console.log('scrapeApod; all caught up with API, will try again in 24 hours');
    con.end();
    setTimeout(() => {
      scrapeApod(apiKey);
    }, 60 * 60 * 24 * 1000);
  } else {
    try {
      await fetch("https://api.nasa.gov/planetary/apod?api_key=" +
        `${apiKey}&date=${cursorYear}-${cursorMonth}-${cursorDay}`)
        .then(checkRemainingRequests)
        .then(r => r.json())
        .then(r => {
          if (r.code || r.msg) {
            // TODO: get a better way to alternatively NOT call
            // the sql.  Probably a good case for async/await pattern here.
            offset = offset + 1;
            return sqlStatements.noop;
          } else if (
            r.hasOwnProperty('error') &&
            r.error.code === 'OVER_RATE_LIMIT'
          ) {
            errored = true;
            throw 'Ran out of Rate of Requests!';
          }

          offset = 1;

          return sqlStatements.insertNewApodRecord(con, r);
        })
        .then(sql => sqlQueryPromise(con, sql))
        .then(() => {
          if (!errored) {
            scrapeApod(apiKey, offset);
          } else { // try in an hour
            console.log('scrapeApod; Rate Limit maxxed out. Will try again in an hour-ish');
            setTimeout(() => {
              scrapeApod(apiKey, offset);
            }, 4000000);
          }
        })
        .catch(e => {
          console.error('scrapeApod; error during update of database during promise chain.  Will try again in about an hour', e);
          setTimeout(() => {
            scrapeApod(apiKey, offset);
          }, 4000000);
        });

      con && con.end();
    } catch (e) {
      console.error('scrapeApod; error during update of database');
      con && con.end();
    }
  }
}

scrapeApod(apiKey)
.catch(e => {
  console.error('scrapeApod; General Error will try again in four hours');
  setTimeout(() => {
    scrapeApod(apiKey, offset);
  }, 60 * 60 * 4 * 1000);
});
