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
			if (!user) {
				req.flash('error', 'That user does not exist');
				return res.redirect('back');
			}
			new Report()
				.query(qb => {
					qb.where('userID', user.attributes.id);
				})
				.fetchAll()
				.then(reports => {
					return res.render('admin/showUser', {
						title: 'CS2340 :: Show User',
						data: user,
						user: req.session.user,
						reports: reports.models
					});
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
				users: users.models,
				user: req.session.user
			});
		});
}

module.exports.banUser = function(req, res) {
	new User()
		.query(qb => {
			qb.where('id', req.params.id);
			qb.limit(1);
		})
		.fetch()
		.then(user => {
			if (!user) {
				req.flash('error', 'That user does not exist');
				return res.redirect('back');
			}

			user.save({
				locked: true
			}, {patch: true})
			.then(locked => {
				req.flash('success', 'That user has been successfully banned');
				return res.redirect('back');
			});
		});
}

module.exports.unbanUser = function(req, res) {
	new User()
		.query(qb => {
			qb.where('id', req.params.id);
			qb.limit(1);
		})
		.fetch()
		.then(user => {
			if (!user) {
				req.flash('error', 'That user does not exist');
				return res.redirect('back');
			}

			user.save({
				locked: false
			}, {patch: true})
			.then(locked => {
				req.flash('success', 'That user has been successfully unbanned');
				return res.redirect('back');
			});
		});
}

module.exports.deleteUser = function(req, res) {
	new User()
		.query(qb => {
			qb.where('id', req.params.id);
			qb.limit(1);
		})
		.fetch()
		.then(user => {
			user.destroy()
			.then(deleted => {
				req.flash('success', 'That user account has been successfully deleted.')
				return res.redirect('/admin/users');
			});
		});
}

module.exports.editUser = function(req, res) {
	new User()
		.query(qb => {
			qb.where('id', req.params.id);
		})
		.fetch()
		.then(data => {
			let roles = [false, false, false, false];
			roles[Number(data.attributes.role)] = true;
			return res.render('admin/editUser', {
				title: 'CS2340 :: Edit User',
				user: req.session.user,
				data: data,
				roles: roles,
				_csrf: req.csrfToken()
			});
		});
}

module.exports.saveEditUser = function(req, res) {
	if (!req.body.username) {
		req.flash('error', 'Username is a required input');
		return res.redirect('back');
	}
	if (!req.body.role) {
		req.flash('error', 'Role is a required input');
		return res.redirect('back');
	}
	new User()
		.query(qb => {
			qb.where('id', req.params.id);
		})
		.fetch()
		.then(data => {
			data.save({
				username: req.body.username,
				title: req.body.title,
				homeaddress: req.body.homeaddress,
				role: req.body.role
			}, {patch: true})
			.then(done => {
				req.flash('success', 'That user has been successfully updated');
				return res.redirect('/admin/users/' + data.attributes.id);
			});
		});
}

module.exports.reports = function(req, res) {
	new Report()
		.fetchAll()
		.then(reports => {
			return res.render('admin/reports', {
				title: 'CS2340 :: Reports',
				reports: reports.models,
				user: req.session.user
			});
		});
}

module.exports.showReport = function(req, res) {
	if (!req.params.id) {
		req.flash('error', 'No report with that ID exists');
		return res.redirect('back');
	}

	new Report()
		.query(qb => {
			qb.where('id', req.params.id);
			qb.limit(1);
		})
		.fetch()
		.then(report => {
			if (!report) {
				req.flash('error', 'No report with that ID exists');
				return res.redirect('back');
			}
			new User()
				.query(qb => {
					qb.where('id', report.attributes.userID);
				})
				.fetch()
				.then(submitter => {
					new Quality()
						.query(qb => {
							qb.where('report', report.attributes.id);
							qb.orderBy('created_at', 'DESC');
						})
						.fetchAll()
						.then(qualities => {
							return res.render('admin/showReport', {
								title: 'CS2340 :: View Report',
								report: report,
								qualities: qualities.models,
								submitter: submitter,
								user: req.session.user
							});
						});
				});
		});
}