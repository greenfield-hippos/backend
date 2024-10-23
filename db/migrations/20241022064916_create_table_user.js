/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('user', (table) => {
    table.increments('id').primary();
    table.string('username').notNullable().unique();
    table.string('hash').notNullable();
    table.string('salt').notNullable();
    table.boolean('isAdmin').notNullable();
    table.timestamp('account_created').defaultTo(knex.fn.now());
    table.timestamp('last_login').defaultTo(knex.fn.now());
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTable('user');
};
