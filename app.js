var express = require('express');
var path = require('path');
var session = require('express-session');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('express-flash');
var nconf = require('nconf');
var hbs = require('hbs');
var bookshelf = require('bookshelf');
global.config = nconf.argv().env().file({ file: path.join(__dirname, 'config.json') });

var app = express();

var knexfile = require('./knexfile')[process.env.NODE_ENV];

var knex = require('knex')(knexfile);

bookshelf.DB = require('bookshelf')(knex);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/partials');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var RedisStore = require('connect-redis')(session);

app.use(session({
	cookie: {
		maxAge: 5009600,
		domain: process.env.NODE_ENV == 'production' ? 'water.joetorraca.com' : 'localhost'
	},
	secret: config.get('session').secret,
	resave: false,
	saveUninitialized: false,
	store: new RedisStore({
		ttl: 3600
	})
}));

app.use(flash());

hbs.registerHelper('ifAdmin', function(userObject, options) {
    if (userObject && userObject.role === 3) {
        return options.fn(this);
    }
    return options.inverse(this);
});

hbs.registerHelper('ifManager', function(userObject, options) {
    if (userObject && userObject.role >= 2) {
        return options.fn(this);
    }
    return options.inverse(this);
});

hbs.registerHelper('ifWorker', function(userObject, options) {
    if (userObject && userObject.role >= 1) {
        return options.fn(this);
    }
    return options.inverse(this);
});

let controllers = require('./controllers/');
require("./routes.js")(app, controllers);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
