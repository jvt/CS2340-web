exports.up = function(knex, Promise) {
  return knex.schema.table('users', function (table) {
    table.integer('attempts').after('locked').notNullable().defaultTo(0);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('users', function (table) {
    table.dropColumn('attempts');
  });
};