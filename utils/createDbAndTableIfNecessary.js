const sqlQueryPromise = require('./sqlQueryPromise');

const sqlStatments = require('./sqlStatements');

module.exports = async function createDbAndTableIfNecessary (con) {
  try {
    await sqlQueryPromise(con, sqlStatments.createDatabase);
    await sqlQueryPromise(con, sqlStatments.useDatabase);
    await sqlQueryPromise(con, sqlStatments.createTable);
    
    return con;
  } catch (e) {
    console.log('createDbAndTableIfNecessary');
    return null;
  }
};