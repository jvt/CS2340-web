const async = require('async');
const bcrypt = require('bcrypt');

const User = require('../models/user').model;
const Report = require('../models/report').model;
const Quality = require('../models/quality').model;

const knex = require('knex');

/**
 * Creates a login session and responds with the user's data & API token
 * @param  {Object} req Request object
 * @param  {Object} res Response object
 * @return {null}
 */
module.exports.createSession = function(req, res) {
	if (!req.body.username || !req.body.password) {
		const response = {
			'status': 'error',
			'messages': [
				'Missing required parameter'
			]
		};
		return res.json(response);
	}

	new User()
		.query(function(qb) {
			qb.where('username', req.body.username);
			qb.limit(1);
		})
		.fetch()
		.then(function(dbUser) {
			if (dbUser) {
				if (dbUser.attributes.locked) {
					const response = {
						'status': 'success',
						'auth': false,
						'messages':[
							'User account has been locked'
						]
					};
					return res.json(response);
				} else {
					let dbPassword = dbUser.attributes.password;
					bcrypt.compare(req.body.password, dbPassword, function(error, result) {
						if (error) {
							const response = {
								'status': 'error',
								'messages': [
									'An internal server error occurred'
								]
							};
							return res.status(500).json(response);
						} else {
							if (result) {
								dbUser.save({
									attempts: 0	
								}, {patch: true})
								.then(() => {
									const response = {
										'status': 'success',
										'auth': true,
										'messages':[],
										'userData': {
											'id': dbUser.attributes.id,
											'authToken': dbUser.attributes.token,
											'username': dbUser.attributes.username,
											'role': dbUser.attributes.role,
											'created_at': dbUser.attributes.created_at
										}
									};
									return res.json(response);
								});
							} else {
								if (dbUser.attributes.attempts >= 2) {
									dbUser.save({
										attempts: dbUser.attributes.attempts + 1,
										locked: true
									}, {patch: true})
									.then(() => {
										const response = {
											'status': 'success',
											'auth': false,
											'messages': [
												'Too many login attempts'
											]
										};
										return res.json(response);
									});
								} else {
									dbUser.save({
										attempts: dbUser.attributes.attempts + 1	
									}, {patch: true})
									.then(() => {
										const response = {
											'status': 'success',
											'auth': false,
											'messages': [
												'Invalid username or password'
											]
										};
										return res.json(response);
									});
								}
							}
						}
					});
				}
			} else {
				const response = {
					'status': 'error',
					'messages': [
						'Invalid username or password'
					]
				};
				return res.json(response);
			}
		});
}

/**
 * Creates a new user in the database
 * @param  {Object} req Request object
 * @param  {Object} res Response object
 * @return {null}
 */
module.exports.createUser = function(req, res) {
	if (!req.body.username || !req.body.password || !req.body.confirm_password) {
		const response = {
			'status': 'error',
			'messages': [
				'Missing required parameter'
			]
		};
		return res.json(response);
	}

	if (req.body.password.length < 7) {
		const response = {
			'status': 'error',
			'messages': [
				'Password must be at least 7 characters'
			]
		};
		return res.json(response);
	}

	if (req.body.password != req.body.confirm_password) {
		const response = {
			'status': 'error',
			'messages': [
				'Passwords do not match'
			]
		};
		return res.json(response);
	}

	if (!req.body.role) req.body.role = 0; // Default to User

	let salt = bcrypt.genSaltSync();
	let hash = bcrypt.hashSync(req.body.password, salt);

	new User()
		.query(function(qb) {
			qb.where('username', req.body.username);
			qb.limit(1);
		})
		.fetch()
		.then(function(duplicate) {
			if (duplicate) {
				const response = {
					'status': 'error',
					'messages': [
						'Username has already been used.'
					]
				};
				return res.json(response);
			} else {
				let tokenSalt = bcrypt.genSaltSync();
				let token = bcrypt.hashSync(req.body.username + hash, tokenSalt);
				token = token.replace(/\W/g, '');
				new User({
					username: req.body.username,
					password: hash,
					token: token,
					role: req.body.role
				})
				.save()
				.then(function(dbUser) {
					if (dbUser) {
						const response = {
							'status': 'success',
							'messages': [
								'User has been created'
							],
							'data': {
								'id': dbUser.attributes.id,
								'authToken': token
							}
						};
						return res.json(response);
					} else {
						const response = {
							'status': 'error',
							'messages': [
								'An internal server error occurred'
							]
						};
						return res.status(500).json(response);
					}
				});
			}
		});
}

/**
 * Returns user data from the database
 * @param  {Object} req Request object
 * @param  {Object} res Response object
 * @return {null}
 */
module.exports.getUser = function(req, res) {
	if (!req.params.id) {
		const response = {
			'status': 'error',
			'messages': [
				'An ID parameter is required'
			]
		};
		return res.status(500).json(response);
	}

	new User({
		id: req.params.id
	}).fetch()
	.then(function(dbRecord) {
		if (!dbRecord || !dbRecord.attributes) {
			const response = {
				'status': 'error',
				'messages': [
					'User not found'
				]
			};
			return res.status(404).json(response);
		}

		const removeFromResponse = ['password', 'token', 'resetToken', 'resetExpiration'];

		let data = dbRecord.attributes;

		for (let removal in removeFromResponse) {
			delete data[removeFromResponse[removal]];
		}

		const response = {
			'status': 'success',
			'messages': [],
			'userData': data
		};
		return res.status(200).json(response);
	});
}

/**
 * Updates the user object in the database
 * @param  {Object} req Request object
 * @param  {Object} res Response object
 * @return {null}
 */
module.exports.updateUser = function(req, res) {
	var uid = req.body.userid;
	if (!uid) {
		const response = {
			'status': 'error',
			'messages': [
				'User not found'
			]
		};
		return res.status(404).json(response);
	}

	new User({
		id: uid
	}).fetch()
	.then(function(u) {
		u.attributes.username = req.body.username || u.attributes.username;
		u.attributes.role = req.body.role || u.attributes.role;
		u.attributes.homeaddress = req.body.homeAddress || u.attributes.homeaddress;
		u.attributes.title = req.body.title || u.attributes.title;
		u.save();
		const response = {
			'status': 'success',
			'messages': []
		};
		return res.status(200).json(response);
	});
}

/**
 * GET /api/reports - Load all reports from the database
 * @param  {Object} req Request Object
 * @param  {Object} res Response Object
 */
module.exports.loadReports = function(req, res) {
	new Report()
		.fetchAll()
		.then(reports => {
			async.map(reports.models, (item, cb) => {
				new User({
					id: item.attributes.userID
				}).fetch()
				.then((submitter) => {
					item.attributes.submitter = submitter.attributes.username || 'Unknown';
					new Quality()
						.query(qb => {
							qb.where('report', item.attributes.id);
							qb.orderBy('created_at', 'DESC');
							qb.limit(1);
						})
						.fetch()
						.then(quality => {
							if (quality) {
								item.virusPPM = quality.attributes.virusPPM;
								item.contaminantPPM = quality.attributes.contaminantPPM;
								item.condition = quality.attributes.condition;
							} else {
								item.virusPPM = 'Unknown';
								item.contaminantPPM = 'Unknown';
								item.condition = 'Unknown';
							}
							return cb(null, item.attributes);
						});
				});
			}, (err, results) => {
				const response = {
					'status': 'success',
					'messages': [],
					'reports': results
				};
				return res.status(200).json(response);
			});
		});
}

/**
 * GET /api/reports/location - Load reports within a radius
 * @param  {Object} req Request Object
 * @param  {Object} res Response Object
 */
module.exports.loadReportsLocation = function(req, res) {
	if (!req.query.lat) {
		const response = {
			'status': 'error',
			'messages': [
				'Missing "lat" query parameter'
			]
		};
		return res.status(500).json(response);
	}

	if (!req.query.long) {
		const response = {
			'status': 'error',
			'messages': [
				'Missing "long" query parameter'
			]
		};
		return res.status(500).json(response);
	}

	req.query.long = Number(req.query.long);
	req.query.lat = Number(req.query.lat);

	const raw = '( 6371 * acos( cos( radians(' + req.query.lat + ') ) * cos( radians(latitude) ) * cos( radians(longitude) - radians(' + req.query.long + ')) + sin(radians(' + req.query.lat + ')) * sin(radians(latitude)))) AS distance';

	new Report()
		.query(qb => {
			qb.column(['id', 'userID', 'latitude', 'longitude', 'type', 'created_at', 'updated_at', knex.raw(raw)]);
			qb.having('distance', '<', 25);
		})
		.fetchAll()
		.then(reports => {
			if (reports) {
				async.map(reports.models, (item, cb) => {
					return cb(null, item.attributes);
				}, (err, results) => {
					async.map(results, (item, cb) => {
						new Quality()
							.query(qb => {
								qb.where('report', item.id);
								qb.orderBy('created_at', 'DESC');
								qb.limit(1);
							})
							.fetch()
							.then(condition => {
								if (condition) {
									item.virusPPM = condition.attributes.virusPPM;
									item.contaminantPPM = condition.attributes.contaminantPPM;
									item.condition = condition.attributes.condition;
								} else {
									item.virusPPM = 'Unknown';
									item.contaminantPPM = 'Unknown';
									item.condition = 'Unknown';
								}
								return cb(null, item);
							});
					}, (error, fin) => {
						const response = {
							'status': 'success',
							'messages': [],
							'reports': fin
						};
						return res.status(200).json(response);
					});
				});
			} else {
				const response = {
					'status': 'success',
					'messages': [],
					'reports': []
				};
				return res.status(200).json(response);
			}
		});
}

/**
 * POST /api/reports - Store a new report into the database
 * @param  {Object} req Request Object
 * @param  {Object} res Response Object
 */
module.exports.saveReport = function(req, res) {
	let messages = [];
	if (!req.body.userID) {
		messages.push('"userID" is a required field');
	}
	if (!req.body.latitude) {
		messages.push('"latitude" is a required field');
	}
	if (!req.body.longitude) {
		messages.push('"longitude" is a required field');
	}
	if (!req.body.type) {
		messages.push('"type" is a required field');
	}
	if (!req.body.condition) {
		messages.push('"condition" is a required field');
	}
	if (!req.body.contaminantPPM) {
		messages.push('"Contaminant PPM" is a required field');
	}
	if (!req.body.virusPPM) {
		messages.push('"Virus PPM" is a required field');
	}

	if (messages.length !== 0) {
		const response = {
			'status': 'error',
			'messages': messages
		};
		return res.status(500).json(response);
	}

	new User({
		id: req.body.userID
	}).fetch()
	.then(function(userCheck) {
		if (!userCheck) {
			const response = {
				'status': 'error',
				'messages': [
					'No user with that ID exists'
				]
			};
			return res.status(500).json(response);
		}
		
		new Report({
			userID: req.body.userID,
			latitude: req.body.latitude,
			longitude: req.body.longitude,
			type: req.body.type
		}).save()
		.then(function(result) {
			if (result) {
				new Quality({
					report: result.attributes.id,
					condition: req.body.condition,
					virusPPM: req.body.virusPPM,
					contaminantPPM: req.body.contaminantPPM
				}).save()
				.then(function(qualitySaved) {
					result.attributes.condition = req.body.condition;
					const response = {
						'status': 'success',
						'messages': [],
						'report': result.attributes
					};
					return res.status(200).json(response);	
				})
			} else {
				const response = {
					'status': 'error',
					'messages': [
						'An error occurred saving that report'
					]
				};
				return res.status(500).json(response);
			}
		});
	});
}

/**
 * Save a new quality report into the database
 * @param  {Object} req Request object
 * @param  {Object} res Response object
 */
module.exports.saveQualityReport = function(req, res) {
	if (!req.params.id) {
		const response = {
			'status': 'error',
			'messages': [
				'An ID parameter is required'
			]
		};
		return res.status(500).json(response);
	}

	if (!req.body.condition) {
		const response = {
			'status': 'error',
			'messages': [
				'"condition" is a required body parameter'
			]
		};
		return res.status(500).json(response);
	}

	if (!req.body.contaminantPPM) {
		const response = {
			'status': 'error',
			'messages': [
				'"Contaminant PPM" is a required body parameter'
			]
		};
		return res.status(500).json(response);
	}

	if (!req.body.virusPPM) {
		const response = {
			'status': 'error',
			'messages': [
				'"Virus PPM" is a required body parameter'
			]
		};
		return res.status(500).json(response);
	}

	new Report({
		id: req.params.id
	})
	.fetch()
	.then(dbCheck => {
		if (dbCheck) {

			new Quality({
				report: req.params.id,
				condition: req.body.condition,
				contaminantPPM: req.body.contaminantPPM,
				virusPPM: req.body.virusPPM
			}).save()
			.then(condition => {
				if (condition) {
					const response = {
						'status': 'success',
						'messages': [],
						'condition': req.body.condition,
						'virusPPM': req.body.virusPPM,
						'contaminantPPM': req.body.contaminantPPM
					};
					return res.status(200).json(response);	
				} else {
					const response = {
						'status': 'error',
						'messages': [
							'An unexpected system error has occurred'
						]
					};
					return res.status(500).json(response);
				}
			});
		} else {
			const response = {
				'status': 'error',
				'messages': [
					'That report does not exist'
				]
			};
			return res.status(404).json(response);
		}
	});
}

module.exports.getQualityReports = function(req, res) {
	if (!req.params.id) {
		const response = {
			'status': 'error',
			'messages': [
				'An ID parameter is required'
			]
		};
		return res.status(500).json(response);
	}

	new Quality()
		.query(qb => {
			qb.where('report', req.params.id);
			qb.orderBy('created_at', 'DESC');
		})
		.fetchAll()
		.then(conditions => {
			async.map(conditions.models, (elem, cb) => {
				return cb(null, elem.attributes);
			}, (err, result) => {
				const response = {
					'status': 'success',
					'messages': [],
					'conditions': result
				};
				return res.status(200).json(response);
			});
		});
}

module.exports.getQualityHistory = function(req, res) {
	if (!req.params.id) {
		const response = {
			'status': 'error',
			'messages': [
				'An ID parameter is required'
			]
		};
		return res.status(500).json(response);
	}

	new Report()
		.query(qb => {
			qb.where('id', req.params.id);
			qb.limit(1);
		})
		.fetch()
		.then(reportCheck => {
			if (!reportCheck) {
				const response = {
					'status': 'error',
					'messages': [
						'Report with that ID does not exist'
					]
				};
				return res.status(500).json(response);
			}

			new Quality()
				.query(qb => {
					qb.where('report', req.params.id);
					qb.orderBy('created_at', 'DESC');
				})
				.fetchAll()
				.then(reports => {
					if (!reports) {
						const response = {
							'status': 'success',
							'messages': [
								'No water reports have been recorded '
							],
							'reports': []
						};
						return res.status(200).json(response);
					}

					const conditionCodes = {'potable': 3, 'treatable-muddy': 2, 'treatable-clear': 1, 'waste': 0};

					async.map(reports.models, (item, cb) => {
						let obj = {
							'condition': item.attributes.condition,
							'conditionCode': conditionCodes[item.attributes.condition.toLowerCase()],
							'virusPPM': item.attributes.virusPPM,
							'contaminantPPM': item.attributes.contaminantPPM,
							'date': item.attributes.created_at
						};
						return cb(null, obj);
					}, (err, results) => {
						const response = {
							'status': 'success',
							'reports': results
						};
						return res.status(200).json(response);
					});
				});
		})
}

module.exports.getAllUsers = function(req, res) {
	new User()
		.fetchAll()
		.then(users => {
			if (!users) {
				const response = {
					'status': 'error',
					'messages': [
						'No users in the database'
					],
					'users': []
				};
				return res.status(200).json(response);
			} else {
				async.map(users.models, (item, cb) => {
					let o = {
						'id': item.attributes.id,
						'username': item.attributes.username,
						'homeaddress': item.attributes.homeaddress,
						'title': item.attributes.title,
						'role': item.attributes.role,
						'locked': item.attributes.locked
					};
					return cb(null, o);
				}, (err, results) => {
					const response = {
						'status': 'success',
						'users': results
					};
					return res.status(200).json(response);
				});
			}
		});
}

module.exports.banUser = function(req, res) {
	if (!req.params.id) {
		const response = {
			'status': 'error',
			'messages': [
				'An ID parameter is required'
			]
		};
		return res.status(500).json(response);
	}

	new User()
		.query(qb => {
			qb.where('id', req.params.id);
			qb.limit(1);
		})
		.fetch()
		.then(user => {
			if (!user) {
				const response = {
					'status': 'error',
					'messages': [
						'User with that ID does not exist'
					]
				};
				return res.status(500).json(response);
			}

			user.save({
				locked: true
			}, {
				patch: true
			}).then(saved => {
				const response = {
					'status': 'success',
					'messages': [
						'That user is now banned'
					]
				};
				return res.status(200).json(response);
			})
		});
}

module.exports.unbanUser = function(req, res) {
	if (!req.params.id) {
		const response = {
			'status': 'error',
			'messages': [
				'An ID parameter is required'
			]
		};
		return res.status(500).json(response);
	}

	new User()
		.query(qb => {
			qb.where('id', req.params.id);
			qb.limit(1);
		})
		.fetch()
		.then(user => {
			if (!user) {
				const response = {
					'status': 'error',
					'messages': [
						'User with that ID does not exist'
					]
				};
				return res.status(500).json(response);
			}

			user.save({
				locked: false
			}, {
				patch: true
			}).then(saved => {
				const response = {
					'status': 'success',
					'messages': [
						'That user is now unbanned'
					]
				};
				return res.status(200).json(response);
			})
		});
}

module.exports.deleteUser = function(req, res) {
	if (!req.params.id) {
		const response = {
			'status': 'error',
			'messages': [
				'An ID parameter is required'
			]
		};
		return res.status(500).json(response);
	}

	new User()
		.query(qb => {
			qb.where('id', req.params.id);
			qb.limit(1);
		})
		.fetch()
		.then(user => {
			if (!user) {
				const response = {
					'status': 'error',
					'messages': [
						'User with that ID does not exist'
					]
				};
				return res.status(500).json(response);
			}

			user.destroy()
				.then(deleted => {
					const response = {
						'status': 'success',
						'messages': [
							'That user has been deleted'
						]
					};
					return res.status(200).json(response);
				});
		});
}