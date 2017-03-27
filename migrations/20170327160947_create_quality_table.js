
exports.up = function(knex, Promise) {
  return knex.schema.createTable('quality', function (table) {
    table.increments();
    table.integer('report').unsigned().references('reports.id').onDelete('cascade').notNullable();
    table.string('condition').notNullable();
    table.timestamps();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('quality');
};
