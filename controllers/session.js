const User = require('../models/user').model;
const bcrypt = require('bcrypt');

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
				let password = users.attributes.password;
				bcrypt.compare(req.body.password, password, function(error, result) {
					if (error) {
						req.flash('error', 'An unexpected system error has occurred.');
						return res.redirect('back');
					}
					if (!result) {
						req.flash('error', incorrectMessage);
						return res.redirect('back');
					} else {
						req.session.user = users.attributes;
						req.session.save();
						return res.redirect('/');
					}
				});
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