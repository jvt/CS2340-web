module.exports.index = function(req, res) {
	return res.render('admin/dashboard', {
		title: 'CS2340 :: Admin Panel',
		user: req.session.user
	});
}