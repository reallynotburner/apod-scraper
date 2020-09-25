const sqlQueryPromise = require('./sqlQueryPromise');
const mySqlTableName = process.env.MYSQL_TABLE;
const createTableSql = `CREATE TABLE ${mySqlTableName} (
  id SMALLINT NOT NULL AUTO_INCREMENT,
  date date,
  title varchar(128),
  media_type varchar(64),
  url varchar(255),
  hdurl varchar(255),
  explanation varchar(2048),
  copyright varchar(64),
  thumbnailUrl VARCHAR(255),
  PRIMARY KEY (id)
);`

module.exports = async function createDbAndTableIfNecessary (con, databaseName) {
  try {
    const existingDatabase = await sqlQueryPromise(con, `SHOW DATABASES LIKE '${databaseName}'`);
    if (existingDatabase.length === 0) {
      await sqlQueryPromise(con, `CREATE DATABASE ${databaseName}`);
    }
    await sqlQueryPromise(con, `USE ${databaseName}`);
    const existingTable = await sqlQueryPromise(con, `SHOW TABLES LIKE '${mySqlTableName}'`);
    if (existingTable.length === 0) {
      await sqlQueryPromise(con, createTableSql);
    }
    return con;
  } catch (e) {
    return null;
  }
};