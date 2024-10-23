/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('message', (table) => {
    table.increments('id').primary();
    table.integer('chat_user_id').notNullable();
    table.foreign('chat_user_id').references("id").inTable("chat_user");
    table.integer('conversation_id').notNullable();
    table.foreign('conversation_id').references("id").inTable("conversation");
    table.boolean('is_favorite').defaultTo(false);
    table.string('author').notNullable();
    table.text('content').notNullable();
    table.timestamp('timestamp').defaultTo(knex.fn.now());
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    await knex.schema.dropTable('message');
};
