const User = require('../models/user').model;

module.exports.index = function(req, res) {
	return res.render('admin/dashboard', {
		title: 'CS2340 :: Admin Panel',
		user: req.session.user
	});
}

module.exports.banned = function(req, res) {
	new User()
		.query(qb => {
			qb.where('locked', true);
		})
		.fetchAll()
		.then(users => {
			return res.render('admin/banned', {
				title: 'CS2340 :: Banned Users',
				users: users.models
			});
		});
}