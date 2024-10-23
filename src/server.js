const knex = require('./knex');
const express = require('express');
const app = express();
const cors = require('cors');
const bcrypt = require('bcrypt');
const openaiRequest = require('./openairequest');


const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  try {
    const openaiResponse = await openaiRequest(message);
    res.json({ response: openaiResponse });
  } catch (error) {
    console.error("Error in the the /api/chat route: ", error.message);
    res.status(500).json({ error: "Failed to generate a response from OpenAI."});
  }
});

const CHAT_USER_TABLE = "chat_user";

app.post('/user', async (req, res) => {
  const {username, password} = req.body;
  const saltedHash = await hashPassword(password);

  let newChatUser = {
    username: username,
    salted_hash: saltedHash,
    is_admin: false
  };

  const userCreated = await knex
    .returning("*")
    .insert(newChatUser)
    .into(CHAT_USER_TABLE);

  res.status(201).json(userCreated);
});

app.post('/login', async (req, res) => {
  const {username, password} = req.body;

  const user = await knex
  .select("*")
  .from(CHAT_USER_TABLE)
  .where({username: username})
  .first();

  if (user) {
    const saltedHash = user.salted_hash;
    const authenicationResult = await verifyPassword(password, saltedHash);
    res.status(200).json({authenticationSuccessful: authenicationResult});
  } else {
    res.status(404).send("User Not Found");
  }
});

//for new user creation
async function hashPassword(plainTextPassword) {
  const saltRounds = 10; //the higher the more secure but more time-consuming
  try {
      const hash = await bcrypt.hash(plainTextPassword, saltRounds); //applies salt and hashes the password
      return hash;
  } catch (err) {
      console.error('Hashing error:', err);
  }
}

//for existing user login
async function verifyPassword(plainTextPassword, hashedPasswordFromDB) {
  try {
      const match = await bcrypt.compare(plainTextPassword, hashedPasswordFromDB); //the salt can be implicitly extracted from the hashed password
      return match;
  } catch (err) {
      console.error('Verification error:', err);
  }
}

app.listen(PORT, () =>{
  console.log(`Express server is up and running on ${PORT}`);
});