var auth = require('./helpers/authentication');
var csrf = require('csurf');

module.exports = function(app, c) {
	app.use(csrf());

	app.get('/', c.index.index);
}