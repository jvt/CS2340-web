const User = require('../models/user').model;
const Report = require('../models/report').model;
const Quality = require('../models/quality').model;

const async = require('async');

module.exports.index = function(req, res) {
	async.parallel({
		users: done => {
			new User()
				.fetchAll()
				.then(users => {
					return done(null, users.models.length);
				});
		},
		banned: done => {
			new User()
				.query(qb => {
					qb.where('locked', 1);
				})
				.fetchAll()
				.then(users => {
					return done(null, users.models.length);
				});	
		},
		reports: done => {
			new Report()
				.fetchAll()
				.then(reports => {
					return done(null, reports.models.length);
				});
		},
		qualityReports: done => {
			new Quality()
				.fetchAll()
				.then(qualities => {
					return done(null, qualities.models.length);
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

module.exports.users = function(req, res) {
	new User()
		.fetchAll()
		.then(users => {
			return res.render('admin/users', {
				title: 'CS2340 :: Users',
				users: users.models,
				user: req.session.user
			});
		});
}

module.exports.getUser = function(req, res) {
	if (!req.params.id) {
		req.flash('error', 'An unexpected system error has occurred');
		return res.redirect('/admin');
	}

	if (req.params.id == 'banned') {
		return res.redirect('/admin/users/banned');
	}

	new User()
		.query(qb => {
			qb.where('id', req.params.id);
			qb.limit(1);
		})
		.fetch()
		.then(user => {
			return res.render('admin/showUser', {
				title: 'CS2340 :: Show User',
				data: user.attributes,
				user: req.session.user
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