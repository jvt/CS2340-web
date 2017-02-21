var auth = require('./helpers/authentication');
var csrf = require('csurf');

module.exports = function(app, c) {
	// API routes
	app.post('/api/session', c.api.createSession);

	app.use(csrf());

	app.get('/', c.index.index);
}