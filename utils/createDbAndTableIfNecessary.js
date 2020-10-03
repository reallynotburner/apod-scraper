const sqlQueryPromise = require('./sqlQueryPromise');

const sqlStatments = require('./sqlStatements');
const mySqlTableNameNext = process.env.MYSQL_TABLE_NEXT;


module.exports = async function createDbAndTableIfNecessary (con) {
  try {
    await sqlQueryPromise(con, sqlStatments.createDatabase);
    await sqlQueryPromise(con, sqlStatments.useDatabase);
    await sqlQueryPromise(con, sqlStatments.createTable());
    await sqlQueryPromise(con, sqlStatments.createTable(mySqlTableNameNext));
    
    return con;
  } catch (e) {
    console.log('createDbAndTableIfNecessary');
    return null;
  }
};