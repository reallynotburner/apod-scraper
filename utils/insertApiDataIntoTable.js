const sqlConnectPromise = require("./sqlConnectPromise");
const sqlQueryPromise = require("./sqlQueryPromise");
const sqlStatements = require("./sqlStatements");

const mySqlEndpoint = process.env.MYSQL_ENDPOINT;
const mySqlUser = process.env.MYSQL_USER;
const mySqlPassword = process.env.MYSQL_PASSWORD;
const sqlConfig = {
  host: mySqlEndpoint,
  user: mySqlUser,
  password: mySqlPassword,
};

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

module.exports = insertApiDataIntoTable;