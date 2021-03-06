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
	app.get('/api/reports/:id/history', c.api.getQualityHistory);
	app.get('/api/user/', c.api.getAllUsers);
	app.get('/api/user/:id', c.api.getUser);
	app.get('/api/user/:id/ban', c.api.banUser);
	app.get('/api/user/:id/unban', c.api.unbanUser);
	app.get('/api/user/:id/delete', c.api.deleteUser);
	app.post('/api/user', c.api.createUser);
	app.post('/api/user/update', c.api.updateUser);

	app.use(csrf());

	app.get('/', [auth.isAuthenticated], c.index.index);
	app.get('/reports/create', [auth.isAuthenticated], c.reports.create);
	app.post('/reports/create', [auth.isAuthenticated], c.reports.store);
	app.get('/reports/:id', [auth.isAuthenticated], c.reports.show);
	app.get('/reports/:id/quality', [auth.isAuthenticated, auth.worker], c.reports.markQuality);
	app.post('/reports/:id/quality', [auth.isAuthenticated, auth.worker], c.reports.saveQuality);

	app.get('/admin', [auth.isAuthenticated, auth.admin], c.admin.index);
	app.get('/admin/users', [auth.isAuthenticated, auth.admin], c.admin.users);
	app.get('/admin/users/banned', [auth.isAuthenticated, auth.admin], c.admin.banned);
	app.get('/admin/users/:id', [auth.isAuthenticated, auth.admin], c.admin.getUser);
	app.get('/admin/reports', [auth.isAuthenticated, auth.admin], c.admin.reports);
	app.get('/admin/reports/:id', [auth.isAuthenticated, auth.admin], c.admin.showReport);
	app.get('/admin/users/:id/delete', [auth.isAuthenticated, auth.admin], c.admin.deleteUser);
	app.get('/admin/users/:id/edit', [auth.isAuthenticated, auth.admin], c.admin.editUser);
	app.post('/admin/users/:id/edit', [auth.isAuthenticated, auth.admin], c.admin.saveEditUser);
	app.get('/admin/users/:id/ban', [auth.isAuthenticated, auth.admin], c.admin.banUser);
	app.get('/admin/users/:id/unban', [auth.isAuthenticated, auth.admin], c.admin.unbanUser);

	app.get('/login', [auth.isNotAuthenticated], c.session.login);
	app.get('/register', [auth.isNotAuthenticated], c.session.register);
	app.post('/login', [auth.isNotAuthenticated], c.session.performLogin);
	app.post('/register', [auth.isNotAuthenticated], c.session.performRegister);
	app.get('/logout', c.session.logout);
}