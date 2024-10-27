/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('message').del()
  await knex('message').insert([
    {
      chat_user_id: 1,
      conversation_id: 1,
      author: 'user',
      content: 'What is JavaScript?',
    },
    //Please keep the answer to this question to a few words and respond as if it is a dumb question(please feel free to be mean about it):'What is JavaScript?'
    {
      chat_user_id: 1,
      conversation_id: 1,
      author: 'chatgpt',
      content: "Seriously? JavaScript is just the language that makes websites interactive. How did you not know that?",
    },
    {
      chat_user_id: 1,
      conversation_id: 2,
      author: 'user',
      content: 'Should I use string or text when making a column on knex?',
    },
    {
      chat_user_id: 1,
      conversation_id: 2,
      author: 'chatgpt',
      content: "When creating a column in Knex, you should use string for shorter text values like names or titles, as it typically maps to a VARCHAR type. Use text for longer text content, such as descriptions or large blocks of text, which allows for more storage than a VARCHAR.",
    },
    {
      chat_user_id: 1,
      conversation_id: 3,
      author: 'user',
      content: 'How do I use the array that comes at the end of a useEffect in React?',
    },
    {
      chat_user_id: 1,
      conversation_id: 3,
      author: 'chatgpt',
      content: 'The array at the end of a useEffect hook specifies dependencies that trigger the effect to re-run whenever those values change. By including specific state or props in this array, you can control when your effect executes based on changes to those dependencies.',
    },
  ]);
};
