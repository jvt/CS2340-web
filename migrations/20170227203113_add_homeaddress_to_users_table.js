exports.up = function(knex, Promise) {
  return knex.schema.table('users', function (table) {
    table.text('homeaddress').after('token').nullable();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('users', function (table) {
    table.dropColumn('homeaddress');
  });
};