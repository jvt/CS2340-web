exports.up = function(knex, Promise) {
  return knex.schema.table('quality', function (table) {
    table.integer('virusPPM').after('condition');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('quality', function (table) {
  	table.dropColumn('virusPPM');
  });
};