 require("dotenv").config({ path: "./.env.local"});

 const DB_USER = process.env.DB_USER;
 const DB_NAME = process.env.DB_NAME;
 const DB_HOST = process.env.DB_HOST;
 const DB_PORT = process.env.DB_PORT;
 const DB_URL = process.env.DB_URL
 const DB_PASSWORD = process.env.DB_PASSWORD; 

module.exports = {
  client: "postgresql",
  connection: DB_URL || {
    host: DB_HOST || "127.0.0.1",
    port: DB_PORT || "5432",
    database: DB_NAME || "greenfield",
    user: DB_USER || "postgres",
    password: DB_PASSWORD || "codechrysalis",
  },
  migrations: {
    directory: "./db/migrations",
  },
  seeds: {
    directory: "./db/seeds",
  },
};