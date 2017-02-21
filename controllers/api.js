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
								'A server error occurred'
							]
						};
						return res.status(500).json(response);
					} else {
						if (result) {
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