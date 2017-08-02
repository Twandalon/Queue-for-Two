'use strict';

const pg = require('pg');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const requestProxy = require('express-request-proxy'); // REVIEW: We've added a new package here to our requirements, as well as in the package.json
const PORT = process.env.PORT || 4000;
const app = express();
// const conString = 'postgres://USERNAME:PASSWORD@HOST:PORT';
const conString = 'postgres://localhost:5432/myapp_test'; // DONE: Don't forget to set your own conString
const client = new pg.Client(conString);
client.connect();
client.on('error', err => console.error(err));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('./public'));

// This function is a proxy method that acts as middleware for our Github API request. We need it to send our request for the API and call back the response while obfuscating our GITHUB_TOKEN value. It receives a request from the client.
function proxyMovieDB(request, response) {
  console.log('Routing MovieDB request for', request.params[0]);
  (requestProxy({
    url: `https://api.themoviedb.org/${request.params[0]}`,
    headers: {Authorization: `token ${process.env.THEMOVIEDB_TOKEN}`}
  }))(request, response);
}

// This route, the app.get('/', etc) route, is a route that will send a request to fetch index.html's content for the web app. It receives a request from the HTML triggered by the user.
app.get('/', (request, response) => response.sendFile('index.html', {root: './public'}));
app.get('/sign-up', (request, response) => response.sendFile('index.html', {root: './public'}));
app.get('/login', (request, response) => response.sendFile('index.html', {root: './public'}));
app.get('/find-movie', (request, response) => response.sendFile('index.html', {root: './public'}));
app.get('/your-titles', (request, response) => response.sendFile('index.html', {root: './public'}));
app.get('/others-titles', (request, response) => response.sendFile('index.html', {root: './public'}));
app.get('/shared-titles', (request, response) => response.sendFile('index.html', {root: './public'}));
app.get('/about-us', (request, response) => response.sendFile('index.html', {root: './public'}));
app.get('/themoviedb/*', proxyMovieDB);


//////// ** DATABASE LOADERS ** ////////
////////////////////////////////////////
function loadCustomers() {
  fs.readFile('./public/data/customers.json', (err, fd) => {
    JSON.parse(fd.toString()).forEach(ele => {
      client.query(
        'INSERT INTO Customers(username, password, name, email) VALUES($1, $2, $3, $4) ON CONFLICT DO NOTHING',
        [ele.author, ele.authorUrl]
      )
      .catch(console.error);
    })
  })
}

function loadMedia() {
  fs.readFile('./public/data/media.json', (err, fd) => {
    JSON.parse(fd.toString()).forEach(ele => {
      client.query(
        'INSERT INTO Media(url_string) VALUES($1) ON CONFLICT DO NOTHING',
        [ele.author, ele.authorUrl]
      )
      .catch(console.error);
    })
  })
}

function loadDB() {
  client.query(`
    CREATE TABLE IF NOT EXISTS Customers (
    customer_id SERIAL PRIMARY KEY,
    username VARCHAR(100),
    password VARCHAR(100),
    name VARCHAR(255),
    email VARCHAR(255)
    );`
  )
  .then(loadCustomers)
  .catch(console.error);

  client.query(`
    CREATE TABLE IF NOT EXISTS Media (
    media_id SERIAL PRIMARY KEY,
    url_string text
    );`
  )
  .then(loadMedia)
  .catch(console.error);

  client.query(`
    CREATE TABLE IF NOT EXISTS Customers_Media (
    customer_id INT REFERENCES Customers(customer_id),
    media_id INT REFERENCES Media(media_id),
    CONSTRAINT queue_item UNIQUE (customer_id, media_id));`
  )
  .catch(console.error);
}

//SQL query to create customer table.

// CREATE TABLE IF NOT EXISTS Customers (
// customer_id SERIAL PRIMARY KEY,
// username VARCHAR(100),
// password VARCHAR(100),
// name VARCHAR(255),
// email VARCHAR(255)
// );

// SQL query to create media table

// CREATE TABLE IF NOT EXISTS Media (
// media_id SERIAL PRIMARY KEY,
// url_string text
// );

// SQL query to insert a row into Customers

// INSERT INTO Customers
// (username, password, name, email)
// VALUES ('carrieH','lilies','Carrie Hans', 'carriehans@gmail.com');

// SQL query to insert a row into Media

// INSERT INTO Media
// (url_string)
// VALUES ('https://www.themoviedb.org/tv/1399-game-of-thrones'
// );

// SQL Query to create associative table
// Customers_Media, ensuring that a customer
// cannot add the same title to their queue twice

// CREATE TABLE IF NOT EXISTS Customers_Media (
// customer_id INT REFERENCES Customers(customer_id),
// media_id INT REFERENCES Media(media_id),
// CONSTRAINT queue_item UNIQUE (customer_id, media_id));

// Insert values into Customers_Media table

// INSERT INTO Customers_Media
// (customer_id, media_id)
// VALUES (1,5);

// Query selecting url_strings for all
// queue items two customers
// have in common

// SELECT DISTINCT url_string
// FROM Media
// INNER JOIN Customers_Media
// ON Media.media_id = Customers_Media.media_id
// WHERE Customers_Media.media_id IN
// (SELECT media_id
// FROM Customers_Media
// GROUP BY media_id
// HAVING COUNT(*) > 1);

// To select usernames from Customers table

// SELECT username FROM Customers;
