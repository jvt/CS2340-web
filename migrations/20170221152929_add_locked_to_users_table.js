exports.up = function(knex, Promise) {
  return knex.schema.table('users', function (table) {
    table.boolean('locked').after('resetExpiration').notNullable().defaultTo(false);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('users', function (table) {
    table.dropColumn('locked');
  });
};