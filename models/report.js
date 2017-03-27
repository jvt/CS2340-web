const bookshelf = require('bookshelf').DB;
let User = require('./user').model;
let Quality = require('./quality').model;

exports.model = bookshelf.Model.extend({
  tableName: 'reports',
  hasTimestamps: true,
  user: function()
  {
  	return this.hasOne(User);
  },
  qualities: function()
  {
  	return this.hasMany(Quality);
  }
});

exports.collection = bookshelf.Collection.extend({
  model: exports.model
});