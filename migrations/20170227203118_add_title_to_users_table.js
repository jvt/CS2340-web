exports.up = function(knex, Promise) {
  return knex.schema.table('users', function (table) {
    table.string('title').after('homeaddress').nullable();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('users', function (table) {
    table.dropColumn('title');
  });
};