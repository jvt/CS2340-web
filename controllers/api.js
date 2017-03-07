const async = require('async');
const bcrypt = require('bcrypt');

const User = require('../models/user').model;
const Report = require('../models/report').model;

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
							}
						} else {
							const response = {
								'status': 'success',
								'auth': false,
								'messages': [
									'Invalid username or password'
								]
							};
							return res.json(response);
						}
					}
				});
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

module.exports.loadReports = function(req, res) {
	new Report()
		.fetchAll()
		.then(reports => {
			async.map(reports.models, (item, cb) => {
				new User({
					id: item.attributes.userID
				}).fetch()
				.then((submitter) => {
					item.attributes.submitter = submitter.attribute.name || 'Unknown';
					return cb(null, item.attributes);
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

module.exports.saveReport = function(req, res) {
	let messages = [];
	if (!req.body.userID) {
		messages.push('"userID" is a required field');
	}
	if (!req.body.address) {
		messages.push('"address" is a required field');
	}
	if (!req.body.type) {
		messages.push('"type" is a required field');
	}
	if (!req.body.condition) {
		messages.push('"condition" is a required field');
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
			address: req.body.address,
			type: req.body.type,
			condition: req.body.condition
		}).save()
		.then(function(result) {
			if (result) {
				const response = {
					'status': 'success',
					'messages': [],
					'report': result.attributes
				};
				return res.status(200).json(response);
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