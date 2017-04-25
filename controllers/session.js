const User = require('../models/user').model;
const bcrypt = require('bcrypt');

module.exports.login = function(req, res) {
	return res.render('session/login', {
		title: 'Login'
	});
}

module.exports.register = function(req, res) {
	return res.render('session/register', {
		title: 'Register'
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
						delete users.attributes.token;
						delete users.attributes.resetToken;
						delete users.attributes.resetExpiration;
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


module.exports.performRegister = function(req, res) {
	if (!req.body.username) {
		req.flash('error', 'Please enter a username');
		return res.redirect('back');
	}
	if (!req.body.password) {
		req.flash('error', 'Please enter a password');
		return res.redirect('back');
	}
	if (!req.body.confirm_password) {
		req.flash('error', 'Please enter a confirmation password');
		return res.redirect('back');
	}
	if (!req.body.role) {
		req.flash('error', 'Please select a role');
		return res.redirect('back');
	}
	if (req.body.confirm_password !== req.body.password) {
		req.flash('error', 'Your passwords don\'t match');
		return res.redirect('back');
	}

	new User()
		.query(qb => {
			qb.where('username', req.body.username);
			qb.limit(1);
		})
		.fetch()
		.then(users => {
			if (!users) {
				let salt = bcrypt.genSaltSync();
				let hash = bcrypt.hashSync(req.body.password, salt);
				let tokenSalt = bcrypt.genSaltSync();
				let token = bcrypt.hashSync(req.body.username + hash, tokenSalt);
				token = token.replace(/\W/g, '');

				new User({
					username: req.body.username,
					password: hash,
					token: token,
					role: req.body.role
				}).save()
				.then(saved => {
					if (saved) {
						req.flash('success', 'Your account has been successfully created');
						delete saved.attributes.token;
						delete saved.attributes.resetToken;
						delete saved.attributes.resetExpiration;
						req.session.user = saved.attributes;
						req.session.save();
						return res.redirect('/');
					} else {
						req.flash('error', 'An unexpected system error has occurred while saving your record');
						return res.redirect('back');
					}
				})
			} else {
				req.flash('error', 'That username has already been taken');
				return res.redirect('back');
			}
		});
}

module.exports.logout = function(req, res) {
	req.session.destroy();
	return res.redirect('/');
}