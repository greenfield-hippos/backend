const knex = require('./knex');
const express = require('express');
const app = express();
const cors = require('cors');
const bcrypt = require('bcrypt');
const openaiRequest = require('./openairequest');
const session = require('express-session')
const crypto = require('crypto');
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex');

const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

app.use(session({
  secret: sessionSecret, 
  resave: false,
  saveUninitialized: false,
  cookie: { path: '/', httpOnly: true, secure: false, maxAge: null } // Currently using all of the default values explicitly
}));

app.use(express.urlencoded({ extended: true }));

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

app.post('/signup', async (req, res) => {
  const {username, password} = req.body;
  const userFound = await getChatUserByUsername(username);

  if (!userFound) {
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
  
    res.status(201).json(userCreated[0]);
  } else {
    res.status(400).send("User Already Exists");
  }
});

app.post('/login', async (req, res) => {
  const {username, password} = req.body;

  const user = await getChatUserByUsername(username);

  if (user) {
    const saltedHash = user.salted_hash;
    const authenicationResult = await verifyPassword(password, saltedHash); //Checks that password is OK

    if (authenicationResult) {
      req.session.username = user.username; //Gives the user a session because password was OK
      const lastLoginUpdateResult = await updateLastLogin(user.id, new Date()); //Updates last_login in the db

      if (lastLoginUpdateResult) {
        res.status(200).json({authenticationSuccessful: authenicationResult});
      } else {
        res.status(500).send("Could Not Log In");
      }
    } else {
      res.status(401).json({authenticationSuccessful: authenicationResult});
    }
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

function updateLastLogin(id, lastLogin) {
  return knex(CHAT_USER_TABLE)
    .returning("*")
    .where({ id: id })
    .update({last_login: lastLogin})
}

function getChatUserByUsername(username) {
  return knex
  .select("*")
  .from(CHAT_USER_TABLE)
  .where({username: username})
  .first();
}

app.listen(PORT, () =>{
  console.log(`Express server is up and running on ${PORT}`);
});