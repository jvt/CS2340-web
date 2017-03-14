const User = require('../models/user').model;

module.exports.login = function(req, res) {
	return res.render('session/login', {
		title: 'Login',
		_csrf: req.csrfToken()
	});
}

module.exports.performLogin = function(req, res) {
	const incorrectMessage = "That username/password combination was incorrect";

	if (!req.body.username) {
		req.flash('error', 'Please enter a username');
		return res.redirect('back');
	}
	if (!req.body.password) {
		req.flash('error', 'Please enter a password');
		return res.redirect('back');
	}

	new User()
		.query(qb => {
			qb.where('username', req.body.username);
			qb.limit(1);
		})
		.fetch()
		.then(users => {
			if (users) {
				
			} else {
				req.flash('error', incorrectMessage);
				return res.redirect('back');
			}
		});
}

module.exports.logout = function(req, res) {
	req.session.desotry();
	return res.redirect('/');
}