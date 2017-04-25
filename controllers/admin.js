const User = require('../models/user').model;
const async = require('async');

module.exports.index = function(req, res) {
	async.parallel({
		users: done => {
			new User()
				.fetchAll()
				.then(users => {
					return done(null, users.models.length);
				});
		}
	}, (err, results) => {
		return res.render('admin/dashboard', {
			title: 'CS2340 :: Admin Panel',
			user: req.session.user,
			data: results
		});
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