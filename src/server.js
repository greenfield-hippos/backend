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

app.post('/api/chat', checkIsAuthenticated, async (req, res) => {
  const { message, user_id, conversation_id } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  if (!user_id) {
    return res.status(400).json({ error: "User ID is required." });
  }

  try {
    const openaiResponse = await openaiRequest(message);

    let associatedConversationID;
    let continuedConversation;
    //if no conversation ID present, add a new conversation and use its ID - otherwise use the ID given
    if (!conversation_id) {
      continuedConversation = false;
      const openaiSummary = await openaiRequest("Summarize the specific topic of the question that was asked in 5 words or less.");
      //is there a way to achieve this without requesting a second time?
      const newConversation = {
        title: openaiSummary,
        updated_at: new Date()
      };

      const newlyCreated = await addConversation(newConversation);
      associatedConversationID = newlyCreated[0].id;
    } else {
      continuedConversation = true;
      associatedConversationID = conversation_id;
    }

    const chatUser = await getChatUserByID(user_id);
    const chatUsername = chatUser.username;

    if (associatedConversationID && chatUsername) { //to make sure we have both before proceeding
      //Preparing the message record for the question the user asked
      const userQuestion = {
        chat_user_id: user_id,
        conversation_id: associatedConversationID,
        author: chatUsername,
        content: message
      };

      //Preparing the message record for the answer received from ChatGPT
      const gptAnswer = {
        chat_user_id: user_id,
        conversation_id: associatedConversationID,
        author: "ChatGPT", //Is this text ok?
        content: openaiResponse
      };

      const addedQuestionArray = await addMessage(userQuestion);
      const addedAnswerArray = await addMessage(gptAnswer);
      const addedQuestion = addedQuestionArray[0];
      const addedAnswer = addedAnswerArray[0];

      if (continuedConversation) {
        await updateConvoLastUpdated(associatedConversationID , new Date());
      }

      if (addedQuestion && addedAnswer) { //to make sure we have made all necessary changes before proceeding
        res.json({
          response: openaiResponse,
          conversation_id: associatedConversationID
        }); //should any of the newly created rows be returned to the front end?
      } else {
        res.status(500).json({ error: "Failed to add the conversation content to the database."});
      }
    } else {
      res.status(500).json({ error: "Failed to retrieve the information required from the database."});
    }
  } catch (error) {
    console.error("Error in the the /api/chat route: ", error.message);
    res.status(500).json({ error: "Failed to generate a response from OpenAI."});
  }
});

const CHAT_USER_TABLE = "chat_user";
const MESSAGE_TABLE = "message";
const CONVERSATION_TABLE = "conversation";

app.post('/signup',checkNotYetAuthenticated, async (req, res) => {
  const {username, password} = req.body;
  const userFound = await getChatUserByUsername(username);

  if (!userFound) {
    const saltedHash = await hashPassword(password);

    let newChatUser = {
      username: username,
      salted_hash: saltedHash,
      is_admin: false
    };
  
    const userCreated = await addUser(newChatUser);
  
    res.status(201).json(userCreated[0]);
  } else {
    res.status(400).send("User Already Exists");
  }
});

app.post('/login',checkNotYetAuthenticated, async (req, res) => {
  const {username, password} = req.body;

  const user = await getChatUserByUsername(username);

  if (user) {
    const saltedHash = user.salted_hash;
    const authenicationResult = await verifyPassword(password, saltedHash); //Checks that password is OK

    if (authenicationResult) {
      req.session.username = user.username; //Gives the user a session because password was OK
      const lastLoginUpdateResult = await updateLastLogin(user.id, new Date()); //Updates last_login in the db and returns the updated user

      if (lastLoginUpdateResult) {
        res.status(200).json({
          authenticationSuccessful: authenicationResult,
          chatUser: lastLoginUpdateResult
        });
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

app.get('/users/:uid/messages', async (req,res) => {
  const userID = parseInt(req.params.uid);

  try {  
    const allMessagesForUser = await getAllMessagesForUser(userID);
    res.status(200).json(allMessagesForUser);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get('/users/:uid/conversations/:cid/messages', async (req,res) => {
  const conversationID = parseInt(req.params.cid);

  try {  
    const allMessagesFromConversation = await getAllMessagesFromConversation(conversationID);
    res.status(200).json(allMessagesFromConversation);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get('/users/:uid/conversations', async (req,res) => {
  const userID = parseInt(req.params.uid);

  try {  
    const allConversationsForUser = await getAllConversationsForUser(userID);
    res.status(200).json(allConversationsForUser);
  } catch (err) {
    res.status(500).send(err);
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

// middleware to test if authenticated
function checkIsAuthenticated (req, res, next) {
  if (req.session.username) {
    next();
  } else {
    res.status(400).send("User Not Logged In");
  }
}

// middleware to test if NOT authenticated
function checkNotYetAuthenticated (req, res, next) {
  if (! req.session.username) {
    next();
  } else {
    res.status(400).send("User Already Logged In");
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

function getChatUserByID(id) {
  return knex
  .select("*")
  .from(CHAT_USER_TABLE)
  .where({id: id})
  .first();
}

//returns an array of objects, even if just one row being added
function addUser(newUserObject) {
  return knex
  .returning("*")
  .insert(newUserObject)
  .into(CHAT_USER_TABLE);
}

//returns an array of objects, even if just one row being added
function addConversation(newConversationObject) {
  return knex
  .returning("*")
  .insert(newConversationObject)
  .into(CONVERSATION_TABLE);
}

function updateConvoLastUpdated(id, lastUpdated) {
  return knex(CONVERSATION_TABLE)
  .returning("*")
  .where({ id: id })
  .update({updated_at: lastUpdated})
}

function getAllConversationsForUser(userID) {
  return knex
  .select()
  .from(CONVERSATION_TABLE)
  .where({chat_user_id: userID})
  .orderBy('updated_at', 'desc')
}

function getAllMessagesForUser(userID) {
  return knex
  .select()
  .from(MESSAGE_TABLE)
  .where({chat_user_id: userID})
  .orderBy('timestamp', 'asc')
}

function getAllMessagesFromConversation(conversationID) {
  return knex
  .select()
  .from(MESSAGE_TABLE)
  .where({conversation_id: conversationID})
  .orderBy('timestamp', 'asc')
}

//returns an array of objects, even if just one row being added
function addMessage(newMessageObject) {
  return knex
  .returning("*")
  .insert(newMessageObject)
  .into(MESSAGE_TABLE);
}

app.listen(PORT, () =>{
  console.log(`Express server is up and running on ${PORT}`);
});