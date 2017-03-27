exports.up = function(knex, Promise) {
  return knex.schema.table('reports', function (table) {
    table.dropColumn('condition');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('reports', function (table) {
    table.string('condition').after('type').notNullable();
  });
};