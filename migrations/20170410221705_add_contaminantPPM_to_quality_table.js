exports.up = function(knex, Promise) {
  return knex.schema.table('quality', function (table) {
    table.decimal('contaminantPPM', 5, 3).after('virusPPM');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('quality', function (table) {
  	table.dropColumn('contaminantPPM');
  });
};