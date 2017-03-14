/**
 * Helper middleware to determine if the current session is logged in
 * @param  {Object}   req  Request object
 * @param  {Object}   res  Response object
 * @param  {Function} next Callback to continue if the request is allowed
 */
module.exports.isAuthenticated = function(req, res, next) {
	if (req.session.user) {
		return next();
	} else {
		return res.redirect('/login');
	}
}

/**
 * Helper middleware to determine if the current session is not logged in
 * @param  {Object}   req  Request object
 * @param  {Object}   res  Response object
 * @param  {Function} next Callback to continue if the request is allowed
 */
module.exports.isNotAuthenticated = function(req, res, next) {
	if (!req.session.user) {
		return next();
	} else {
		return res.redirect('back');
	}
}