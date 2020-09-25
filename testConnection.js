require('dotenv').config();
const sqlQueryPromise = require('./utils/sqlQueryPromise');
const sqlConnectPromise = require('./utils/sqlConnectPromise');
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

async function testConnection() {
  const con = await sqlConnectPromise(sqlConfig)
  .catch(e => {
    console.error('sqlConnectPromise rejected', e);
  });

  if (con) {
    // try reading?
    await sqlQueryPromise(con, `USE ${mySqlDatabaseName}`)
    .catch(e => {
      console.error('sqlQueryPromise useTable rejected', e);
    });

    await sqlQueryPromise(con, `SELECT date FROM ${mySqlTableName} ORDER BY id DESC LIMIT 10`)
    .then(r => {
      console.log('result is r', r);
    })
    .catch(e => {
      console.error('sqlQueryPromise rejected', e);
    });
  }

  con && con.end();
}

testConnection();