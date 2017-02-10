var path = require('path');
var nconf = require('nconf');
var config = nconf.argv().env().file({ file: path.join(__dirname, 'config.json') });

module.exports = {
	development: {
		client: 'mysql',
		connection: config.get('database'),
		pool: {
			min: 2,
			max: 10
		},
		migrations: {
			tableName: 'knex_migrations',
			directory: __dirname + '/migrations',
		}
	},
	production: {
		client: 'mysql',
		connection: config.get('databaseProd'),
		pool: {
			min: 2,
			max: 10
		},
		migrations: {
			tableName: 'knex_migrations',
			directory: __dirname + '/migrations',
		}
	}
};
