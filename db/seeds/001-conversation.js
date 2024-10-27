/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('conversation').del()
  await knex('conversation').insert([
    {
      title: "JavaScript?"
    },
    {
      title: "knex text or string"
    },
    {
      title: "useEffect array"
    },
  ]);
};
