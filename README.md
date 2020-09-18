# Introduction
I would like to gather a large number of JSON's and image urls's for a development project.  I have chosen the dataset behind the Astronomy Picture Of the Day site https://apod.nasa.gov/apod/astropix.html.  They bring the wonder of the cosmos with beautiful images and videos daily, going all the way back to 1995.  The api that supports APOD is https://api.nasa.gov/planetary/apod.  By changing the query parameters you can select any date and it will return the APOD metadata for that day.

# Method
Individually calling for each day of data is burdensome for my apps, and the NASA api.  So I'm pulling all the JSON fields into a MySql database table with this scraper script.  The APOD API has a limit of 2000 accesses per api key per hour.  When you don't have any data in your database, it takes about 6 hours for it to gather all the data in the API back to 1995.  Later, run the script when ever you remember to.  The scraper will pick up on the last APOD entry it stored, and query the api for the next days until it's caught up with todays APOD data.

# Installation
```
npm install
```

# Environmental Variables
You'll need a .env file in the root of your project to make this work.  This will contain your credentials for NASA api as well the desired name for your Database and Table.  Make sure to get a developer api-key at https://api.nasa.gov/, "generate api key" navigation tab. The default 'DEMO_KEY' is limited to about 50 requests PER DAY.  Your Developer api key allows ~2000 requests per hour.  That will take about 5 hours to get the entire dataset from having no data.

You'll need your own values, but here's an example .env file:
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
If the script can't find the database and/or table in the .env variables, the script will create the database and table automatically.

# Starting database
Use mysql CLI or MySql Workbench to start your database management system.

# Run the scraper
```
npm start
```

# Suspend Conditions
- when the rate limit of the api is reached the session remains open on a timeout and will try again in an hour

# Exit Condtions
- there are more days to scrape
- unable to connect with any database
- unable to create a new database if missing.
- unable to create a new table if missing.
