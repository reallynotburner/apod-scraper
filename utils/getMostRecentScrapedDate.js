require('dotenv').config();
const createDbAndTableIfNecessary = require('./createDbAndTableIfNecessary');
const sqlConnectPromise = require('./sqlConnectPromise');
const sqlQueryPromise = require('./sqlQueryPromise');
const sqlStatements = require('./sqlStatements');
const mySqlEndpoint = process.env.MYSQL_ENDPOINT;
const mySqlUser = process.env.MYSQL_USER;
const mySqlPassword = process.env.MYSQL_PASSWORD;
const sqlConfig = {
  host: mySqlEndpoint,
  user: mySqlUser,
  password: mySqlPassword,
};

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

module.exports = getMostRecentScrapedDate;