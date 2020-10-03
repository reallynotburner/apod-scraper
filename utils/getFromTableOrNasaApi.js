// Wrote this to recheck all the dates.
// I was missing ALL of December
// And the 31st of each month after a month with 30 days,
// March 29, 30, 31 except on leap years.
// UGH. 
async function getFromTableOrNasaApi() {
  let errored = false;
  const cursorDate = new Date();
  const stopTime = new Date().getTime();

  const con = await sqlConnectPromise(sqlConfig).catch(e => {
    errored = true;
  });

  if (errored || !con) {
    throw 'Bad MySQL Connection!';
  }

  const isGoodDataBase = await createDbAndTableIfNecessary(con);
  if (!isGoodDataBase) throw 'Bad MySQL Database!';

  // The beginning:
  let cursorYear = 1995;
  let cursorMonth = 6;
  let cursorDay = 16;

  cursorDate.setFullYear(cursorYear);
  cursorDate.setMonth(cursorMonth - 1);
  cursorDate.setDate(cursorDay);

  let cursorTime = cursorDate.getTime();

  do {
    cursorDay++;
    cursorDate.setDate(cursorDay);
    cursorTime = cursorDate.getTime();

    cursorYear = cursorDate.getFullYear();
    cursorMonth = cursorDate.getMonth() + 1;
    cursorDay = cursorDate.getDate();

    const isoDate = `${cursorYear}-${cursorMonth < 10 ? `0${cursorMonth}` : cursorMonth}-${cursorDay < 10 ? `0${cursorDay}` : cursorDay}`;
    console.log(`Checking existing table for ${isoDate}`);
    const sqlResult = await sqlQueryPromise(con, sqlStatements.checkForIsoDate(isoDate));

    if (sqlResult && sqlResult.length > 0) {
      console.log(`Existing table has ${isoDate}`);
      const insertSql = sqlStatements.insertNewApodRecord(con, sqlResult[0], mySqlTableNameNext);
      await sqlQueryPromise(con, insertSql);
    } else {
      const nasaResult = await getDateFromNasaApi(isoDate);

      if (nasaResult) {
        console.log(`RESULT FROM NASA TRUTHY for ${isoDate}`);
        // store result from API in new table
        const insertSql = sqlStatements.insertNewApodRecord(con, nasaResult, mySqlTableNameNext);
        await sqlQueryPromise(con, insertSql);
      } else {
        console.log(`NASA no entry for ${isoDate}`);
      }
    }


  } while (cursorTime < stopTime);

  con && con.end();
}