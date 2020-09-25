module.exports = async function sqlQueryPromise(con, sql) {
  return new Promise((resolve, reject) => {
    try {
      con.query(sql, function (err, result) {
        if (err) {
          console.error('sqlQueryPromise err in callback', err);
          reject(null);
        } else {
          resolve(result);
        }
      });
    } catch (e) {
      console.error('sqlQueryPromise catch in callback', e);
      reject(null);
    }
  });
};
