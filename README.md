# Greenfield Project Backend Repository

## Purpose

To help software engineering students improve their skills and knowledge

## Contributors

- Laurence (CC36)
- Vicente (CC36)
- Jason (CC36)

## Technologies Used

- Node.js
- Express.js
- Knex.js
- PostgreSQL

## Setup
### Express Server

1. Clone the repo locally using your preferred method (HTTPS, SSH, etc.)

2. On your local machine, open command line, go to the root directly of the repo, and run `npm install` to install all dependencies

3. Create a `.env.local` file with a line to assign a value for `OPENAI_API_KEY`. Ask a team member for the value that should be used for this key

4. Finally, run `npm start` to start the server. Note that it will run on port 8080 if no value is specified for the environment variable `process.env.PORT`

### Database

1. For local testing, connect to `psql` to create a database using the command `CREATE DATABASE greenfield;`

2. Back in your terminal, run `npm build` to trigger the migrations that will create the database tables you need

3. Using Postman, while the server is running, create a user for yourself by sending a `POST` command to the endpoint `/signup` with the following JSON body. If it's successful, you will receive a reply with the JSON for your newly created user in its body

```
{
  "username": "putYourUserNameHere",
  "password": "putYouPasswordHere
}

```

4. In psql, verify your new user exists locally by running the command `SELECT * FROM chat_user;`. You should see your new user as a row in the table that is output.

5. In terminal, run `npm run seed` to run the seeds that will populate the other database tables with dummy data.

Now you should have what you need to get started!