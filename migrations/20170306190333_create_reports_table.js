
exports.up = function(knex, Promise) {
  return knex.schema.createTable('reports', function (table) {
    table.increments();
    table.integer('userID').unsigned().references('users.id').onDelete('cascade').notNullable();
    table.text('address').notNullable();
    table.string('type').notNullable();
    table.string('condition').notNullable();
    table.timestamps();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('reports');
};
