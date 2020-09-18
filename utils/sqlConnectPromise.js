var mysql = require('mysql');

module.exports = function sqlConnectPromise(config) {
  return new Promise((resolve, reject) => {
    try {
      const con = mysql.createConnection(config);
      con.connect(err => {
        if (err) {
          reject(null);
        } else {
          resolve(con);
        }
      });
    } catch (e) {
      reject(null);
    }
  });
}