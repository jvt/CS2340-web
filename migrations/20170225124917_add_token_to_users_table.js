exports.up = function(knex, Promise) {
  return knex.schema.table('users', function (table) {
    table.string('token').after('password').notNullable();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('users', function (table) {
    table.dropColumn('token');
  });
};