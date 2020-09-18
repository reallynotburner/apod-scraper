# Introduction
I would like to gather a large number of JSON's and image urls's for a development project.  The Astronomy Picture Of the Day at https://api.nasa.gov/ is an excellent open source project that brings you the wonder of the comsmos with beautiful images and videos daily, going all the way back to 1995.  This api supports the landing page for APOD: https://apod.nasa.gov/apod/astropix.html and you can access a particular date's landing page with https://apod.nasa.gov/apod/apYYYYMMDD.html. That's over 8000 JSON's with image urls and metadata to play with.

Individually calling for each day of data is burndonsome for my apps, and the NASA api.  So I'm pulling all the JSON fields into a MySql database table with this scraper script.  This particular API has a limit of 2000 accesses per api key per hour.  So it takes about 6 hours for it to gather all the data in the API back to 1995.

Once the table is completely populated, my local instance can return all the data, about 8 megabytes worth, via query in about 1 millisecond.  Definitely do backup dumps on the database.  I'm sure thing is one bug away from destroying all the data it gathered.

Run the script when ever you remember to.  The scraper will pick up on the entry it left off, and query the api for the next days until it's caught up with right now.

# Installation
```
npm install
```

# Environmental Variables
You'll need a .env file in the root of your project to make this work.  This will contain your credentials for NASA api as well the desired name for your Database and Table.  Make sure to get a developer api-key at https://api.nasa.gov/.  Just hit the "generate api key" navigation tab.  The 'DEMO_KEY' is limited to about 50 requests PER DAY.  Your Developer api key allows ~2000 requests per hour.

Example .env:
```
NASA_API_KEY=DEMO_KEY
NASA_API_ACCOUNT_ID=1a2b3cd-1a2b-1a2b-1a2b-1a2b3cd1a2b3cd
MYSQL_ENDPOINT=localhost
MYSQL_DATABASE=MyApodDatabase
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_TABLE=ApiRecords
```

# Database and Table creation
If the script doesn't detect the existence of the database and table named in the .env file, the script will attempt to create the database and table automatically.

# Starting database
Use mysqlsh or MySql Workbench to start your database management system.

# Run the scraper
```
npm start
```
You can run in when ever, skipping days is no problem as the script will pick up where it left off during the last session.
It will keep the node session open as long as there are more days to scrape. With my apikey, it takes a few minutes to hit the api the maximum number of times ~2000 hits and then waits a bit more than an hour before getting more.  If you are using the DEMO_KEY, the session would take about 8 months to gather the entire data set, as you only get 50 hits a day on that.  In general on error it leaves the session.  There's still some exit conditions that aren't caught so user beware.
