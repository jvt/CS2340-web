const async = require('async');
const bcrypt = require('bcrypt');

const User = require('../models/user').model;

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
				new User({
					username: req.body.username,
					password: hash,
					role: req.body.role
				})
				.save()
				.then(function(dbUser) {
					if (dbUser) {
						const response = {
							'status': 'success',
							'messages': [
								'User has been created'
							]
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

module.exports.updateUser = function(req, res) {
	
}