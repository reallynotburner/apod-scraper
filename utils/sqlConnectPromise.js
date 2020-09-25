var mysql = require('mysql');

module.exports = function sqlConnectPromise(config) {
  return new Promise((resolve, reject) => {
    try {
      const con = mysql.createConnection(config);
      if (!con) {
        reject('sqlConnectPromise con undefined');
      }
      con.connect(err => {
        if (err) {
          console.error('sqlConnectPromise con error', err);
          reject('sqlConnectPromise con error in callback');
        } else {
          resolve(con);
        }
      });
    } catch (e) {
      reject('sqlConnectPromise con catch');
    }
  });
}
