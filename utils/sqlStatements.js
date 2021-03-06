const mySqlDatabaseName = process.env.MYSQL_DATABASE;
const mySqlTableName = process.env.MYSQL_TABLE;

const createTable = `CREATE TABLE IF NOT EXISTS ${mySqlTableName} (
  id SMALLINT NOT NULL AUTO_INCREMENT,
  date date,
  title varchar(128),
  media_type varchar(64),
  url varchar(255),
  hdurl varchar(255),
  explanation longtext CHARACTER SET utf8mb4,
  copyright varchar(64),
  thumbnailUrl VARCHAR(255),
  PRIMARY KEY (id)
);`

const checkForDatabase = `SHOW DATABASES LIKE '${mySqlDatabaseName}'`
const createDatabase = `CREATE DATABASE IF NOT EXISTS ${mySqlDatabaseName}`
const checkForTable = `SHOW TABLES LIKE '${mySqlTableName}'`;
const useDatabase = `USE ${mySqlDatabaseName}`
const getLatestRecord = `SELECT DATE_FORMAT(date,\'%Y-%m-%d\') date from ${mySqlTableName} ORDER by id DESC LIMIT 1`;
const noop = `SELECT * from ${mySqlTableName} WHERE false`;

const insertNewApodRecord = function (con, record) {
  try {
    const sql = `INSERT INTO ${mySqlTableName} (date, title, media_type, url, hdurl, explanation, copyright, thumbnailUrl) ` +
      `VALUES (` +
      `  ${con.escape(record.date)},` +
      `  ${con.escape(record.title && record.title)},` +
      `  ${con.escape(record.media_type && record.media_type)},` +
      `  ${con.escape(record.url && record.url)},` +
      `  ${con.escape(record.hdurl && record.hdurl)},` +
      `  ${con.escape(record.explanation && record.explanation.substr(0, 2047))},` +
      `  ${con.escape(record.copyright && record.copyright.substr(0, 63))},` + 
      `  ${con.escape(record.thumbnailUrl && record.thumbnailUrl.substr(0, 255))})`;
    return sql;
  } catch (e) {
    console.error('scrapeApod; insert query error');
    return noop;
  }
}
const checkForIsoDate = (isoDate) => (`SELECT DATE_FORMAT(date,\'%Y-%m-%d\') date from ${mySqlTableName} ` +
  `WHERE date = '${isoDate}' ` +
  `ORDER by id DESC LIMIT 1; `);


const recentRecordWithoutThumbnails = `SELECT id, url, DATE_FORMAT(date,\'%Y-%m-%d\') date, media_type ` +
  `FROM ${mySqlTableName} ` +
  `WHERE thumbnailUrl IS NULL ` +
  `ORDER BY id DESC ` +
  `LIMIT 1;`

function updateThumbnail(id, path) {
  return `UPDATE ${mySqlTableName} SET thumbnailUrl = '${path}' WHERE id = ${id}`;
}

const getRecordById = function (id) {
  return `SELECT url, DATE_FORMAT(date,\'%Y-%m-%d\') date, media_type, explanation, thumbnailUrl ` +
    `FROM ${mySqlTableName} ` + 
    `WHERE id = ${id}`;
};

module.exports = {
  checkForDatabase,
  checkForIsoDate,
  checkForTable,
  createTable,
  createDatabase,
  getLatestRecord,
  getRecordById,
  insertNewApodRecord,
  noop,
  recentRecordWithoutThumbnails,
  updateThumbnail,
  useDatabase,
};
