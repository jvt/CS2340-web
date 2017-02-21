const bookshelf = require('bookshelf').DB;

exports.model = bookshelf.Model.extend({
  tableName: 'users',
  hasTimestamps: true
});

exports.collection = bookshelf.Collection.extend({
  model: exports.model
});