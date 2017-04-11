exports.up = function(knex, Promise) {
  return knex.schema.table('quality', function (table) {
    table.integer('contaminantPPM').after('virusPPM');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('quality', function (table) {
  	table.dropColumn('contaminantPPM');
  });
};