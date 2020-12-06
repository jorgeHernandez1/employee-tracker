const mysql = require("mysql");
//config .env file
require("dotenv").config();

const connection = mysql.createConnection({
  //Fill values from .env file
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

module.exports = connection;