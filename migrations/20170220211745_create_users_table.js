
exports.up = function(knex, Promise) {
  return knex.schema.createTable('users', function (table) {
    table.increments();
    table.string('username').notNullable().unique();
    table.string('password').notNullable();
    table.integer('role').defaultTo(0).notNullable();
    table.text('resetToken').nullable();
    table.datetime('resetExpiration').nullable();
    table.timestamps();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('users');
};
