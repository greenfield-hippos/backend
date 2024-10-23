/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('conversation').del()
  await knex('conversation').insert([
    {
      id: 1,
      title: "JavaScript?"
    },
    {
      id: 2,
      title: "knex text or string"
    },
    {
      id: 3,
      title: "useEffect array"
    },
  ]);
};
