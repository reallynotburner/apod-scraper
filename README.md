# Introduction
This is a scraper script running in Node and storing data in a currently running MySql database.

# Installation
```
npm install
```

# Environmental Variables
You'll need a .env file locally to make this work.  This will contain your credentials for NASA api as well as your instance of MySQL.
https://api.nasa.gov/ and hit the "generate api key" navigation tab.  The 'DEMO_KEY' is limited to about 50 requests PER DAY.  Your Developer api key allows ~2000 requests per hour.

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
Use mysqlsh or MySql Workbench to create your database and table.
```
create database MyApodDatabase;

create table ApiRecords(
  TODO: put in the auto-incrementing id expression here!!!!!
  date date,
  title varchar(128),
  media_type varchar(64),
  url varchar(255),
  hdurl varchar(255),
  explanation varchar(2048),
  copyright varchar(64)
);
```
# Starting database
Use mysqlsh or MySql Workbench to start your database running;

# running scraper
```
npm start
```