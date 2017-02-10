var auth = require('./helpers/authentication');
var csrf = require('csurf');

module.exports = function(app, controllers) {
	app.use(csrf());

	app.get('/', function(req, res) {
		res.send(200);
	})
}