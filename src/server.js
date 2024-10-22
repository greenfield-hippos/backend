const knex = require('./knex');
const express = require('express');
const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(PORT, () =>{
  console.log(`Express server is up and running on ${PORT}`);
});