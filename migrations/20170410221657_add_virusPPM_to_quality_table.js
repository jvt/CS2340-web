exports.up = function(knex, Promise) {
  return knex.schema.table('quality', function (table) {
    table.decimal('virusPPM', 5, 3).after('condition');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('quality', function (table) {
  	table.dropColumn('virusPPM');
  });
};