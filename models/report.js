const bookshelf = require('bookshelf').DB;
let User = require('./user').model;

exports.model = bookshelf.Model.extend({
  tableName: 'reports',
  hasTimestamps: true,
  user: function()
  {
  	return this.hasOne(User);
  }
});

exports.collection = bookshelf.Collection.extend({
  model: exports.model
});