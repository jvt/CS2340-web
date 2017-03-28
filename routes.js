var auth = require('./helpers/authentication');
var csrf = require('csurf');

module.exports = function(app, c) {
	// API routes
	app.post('/api/session', c.api.createSession);
	app.get('/api/reports', c.api.loadReports);
	app.get('/api/reports/location', c.api.loadReportsLocation);
	app.post('/api/reports', c.api.saveReport);
	app.post('/api/reports/:id/quality', c.api.saveQualityReport);
	app.get('/api/reports/:id/quality', c.api.getQualityReports);
	app.get('/api/user/:id', c.api.getUser);
	app.post('/api/user', c.api.createUser);
	app.post('/api/user/update', c.api.updateUser);

	app.use(csrf());

	app.get('/', [auth.isAuthenticated], c.index.index);

	app.get('/login', [auth.isNotAuthenticated], c.session.login);
	// app.get('/register', [auth.isNotAuthenticated], c.session.register);
	app.post('/login', [auth.isNotAuthenticated], c.session.performLogin);
	// app.post('/register', [auth.isNotAuthenticated], c.session.performRegister);
	app.get('/logout', c.session.logout);
}