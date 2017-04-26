const async = require('async');
const Report = require('../models/report').model;
const Quality = require('../models/quality').model;
const User = require('../models/user').model;

module.exports.create = function(req, res) {
	return res.render('reports/new', {
		title: 'CS2340 :: Create Report',
		user: req.session.user
	});
}

module.exports.store = function(req, res) {
	
}

module.exports.show = function(req, res) {
	if (!req.params.id) {
		req.flash('error', 'A water report with that ID could not be found');
		return res.redirect('back');
	}

	new Report()
		.query(qb => {
			qb.where('id', req.params.id);
			qb.limit(1);
		})
		.fetch()
		.then(report => {
			if (report) {
				async.parallel([
					(done) => {
						new Quality()
							.query(qb => {
								qb.where('report', report.id);
								qb.orderBy('created_at', 'DESC');
							})
							.fetchAll()
							.then(conditions => {
								if (conditions) {
									report.attributes.condition = conditions.models[0].attributes.condition;
								} else {
									report.attributes.condition = 'Unknown';
								}
								report.attributes.qualityReports = conditions.models.length;
								return done();
							});
					},
					(done) => {
						new User()
							.query(qb => {
								qb.where('id', report.attributes.userID);
								qb.limit(1);
							})
							.fetch()
							.then(reporter => {
								if (reporter) {
									report.attributes.reporter = reporter.attributes.username;
								} else {
									report.attributes.reporter = 'Unknown';
								}
								return done();
							});
					}
				], () => {
					new Quality()
						.query(qb => {
							qb.where('report', report.attributes.id);
							qb.orderBy('created_at', 'DESC');
						})
						.fetchAll()
						.then(qualities => {
							return res.render('reports/show', {
								title: 'CS2340 :: View Report',
								user: req.session.user,
								report: report.attributes,
								qualityReports: qualities.models
							});
						});
				});
				
			} else {
				req.flash('error', 'A water report with that ID could not be found');
				return res.redirect('back');
			}
		});
}

module.exports.markQuality = function(req, res) {
	return res.render('reports/quality', {
		title: 'CS2340 :: New Quality Report',
		report: req.params.id,
		user: req.session.user,
		_csrf: req.csrfToken()
	});
}

module.exports.saveQuality = function(req, res) {
	if (!req.body.condition) {
		req.flash('error', 'Condition is a required input');
		return res.redirect('back');
	}

	new Quality({
		report: req.body.report,
		condition: req.body.condition,
		virusPPM: req.body.virusppm ? req.body.virusppm : null,
		contaminantPPM: req.body.contaminantppm ? req.body.contaminantppm : null
	}).save()
	.then(qual => {
		req.flash('success', 'Successfully stored that report');
		return res.redirect('/reports/' + req.body.report);
	});
}