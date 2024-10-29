/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable("chat_user", (table) => {
    table.increments("id").primary();
    table.string("username").notNullable().unique();
    table.string("salted_hash").notNullable();
    table.boolean("is_admin").notNullable();
    table.timestamp("account_created").defaultTo(knex.fn.now());
    table.timestamp("last_login");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTable("chat_user");
};
