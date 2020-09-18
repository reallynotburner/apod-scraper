module.exports = async function sqlQueryPromise(con, sql) {
  return new Promise((resolve, reject) => {
    try {
      con.query(sql, function (err, result) {
        if (err) {
          reject(null);
        } else {
          resolve(result);
        }
      });
    } catch (e) {
      reject(null);
    }
  });
};
