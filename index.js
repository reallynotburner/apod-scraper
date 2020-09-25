require('dotenv').config();
const fetch = require('isomorphic-fetch');
const createDbAndTableIfNecessary = require('./utils/createDbAndTableIfNecessary');
const sqlQueryPromise = require('./utils/sqlQueryPromise');
const sqlConnectPromise = require('./utils/sqlConnectPromise');
const checkRemainingRequests = require('./utils/checkRemainingRequests');
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
    console.error('bad con!', con)
    throw 'Bad MySQL Connection!';
  } else {
    console.log('good con?', con)
  }

  const isGoodDataBase = await createDbAndTableIfNecessary(con, mySqlDatabaseName);
  if (!isGoodDataBase) throw 'Bad MySQL Database!';

  const recentDateSql = `SELECT DATE_FORMAT(date,\'%Y-%m-%d\') date from ${mySqlTableName} ORDER by id DESC LIMIT 1`;
  const recentDateResult = await sqlQueryPromise(con, recentDateSql);

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
  cursorDate.setMonth(cursorMonth);
  cursorDate.setDate(cursorDay + offset);

  cursorYear = cursorDate.getFullYear();
  cursorMonth = cursorDate.getMonth();
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
    console.log('cursor date is greater than current date');
    con.end();
  } else {
    try {
      fetch("https://api.nasa.gov/planetary/apod?api_key=" +
        `${apiKey}&date=${cursorYear}-${cursorMonth}-${cursorDay}`)
        .then(checkRemainingRequests)
        .then(r => r.json())
        .then(r => {
          if (r.code || r.msg) {
            // TODO: get a better way to alternatively NOT call
            // the sql.  Probably a good case for async/await pattern here.
            offset = offset + 1;
            return `SELECT * from ${mySqlTableName} LIMIT 0`;
          } else if (
            r.hasOwnProperty('error') &&
            r.error.code === 'OVER_RATE_LIMIT'
          ) {
            errored = true;
            throw 'Ran out of Rate of Requests!';
          }

          offset = 1;

          const sql = `INSERT INTO ${mySqlTableName} (date, title, media_type, url, hdurl, explanation, copyright) ` +
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
    } finally {
      con.end();
    }
  }
}

scrapeApod(apiKey)
.catch(e => console.error('general catch', e))
