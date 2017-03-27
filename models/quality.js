const bookshelf = require('bookshelf').DB;
let Report = require('./report').model;

exports.model = bookshelf.Model.extend({
  tableName: 'quality',
  hasTimestamps: true,
  report: function()
  {
  	return this.belongsTo(Report);
  }
});

exports.collection = bookshelf.Collection.extend({
  model: exports.model
});