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
	console.log(req);
	if (!req.body.username || !req.body.password || !req.body.confirm_password) {
		const response = {
			'status': 'error',
			'messages': [
				'Missing required parameter'
			]
		};
		return res.json(response);
	}

	if (req.body.password != req.body.confirm_password) {
		const response = {
			'status': 'error',
			'messages': [
				'Password\'s don\'t match'
			]
		};
		return res.json(response);
	}

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
						'User already exists'
					]
				};
				return res.json(response);
			} else {
				new User({
					username: req.body.username,
					password: hash
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