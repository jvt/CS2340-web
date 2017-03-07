var auth = require('./helpers/authentication');
var csrf = require('csurf');

module.exports = function(app, c) {
	// API routes
	app.post('/api/session', c.api.createSession);
	app.get('/api/reports', c.api.loadReports);
	app.post('/api/report', c.api.saveReport);
	app.get('/api/user/:id', c.api.getUser);
	app.post('/api/user', c.api.createUser);
	app.post('/api/user/update', c.api.updateUser);

	app.use(csrf());

	app.get('/', c.index.index);
}