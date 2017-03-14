exports.up = function(knex, Promise) {
  return knex.schema.table('reports', function (table) {
    table.dropColumn('address');
    table.decimal('latitude', 10, 8).notNullable().after('userID');
    table.decimal('longitude', 11, 8).notNullable().after('latitude');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('reports', function (table) {
    table.text('address').notNullable();
  });
};