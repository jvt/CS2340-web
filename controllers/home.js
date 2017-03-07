/**
 * / - Display the home route
 * @param  {Object} req Request Object
 * @param  {Object} res Response Object
 */
module.exports.index = function(req, res) {
	return res.render('index', {title: 'CS2340'});
}