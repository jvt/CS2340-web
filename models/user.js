const bookshelf = require('bookshelf').DB;
let Report = require('./report').model;

exports.model = bookshelf.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  reports: function()
  {
  	return this.hasMany(Report);
  }
});

exports.collection = bookshelf.Collection.extend({
  model: exports.model
});