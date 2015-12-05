var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

// Mongoose schemas
var User = mongoose.model('User');
var Poll = mongoose.model('Poll');

module.exports = function (app) {
  app.use('/api/v1', router);
};

// Stats
router.get('/stats', function (req, res) {
	User.count({}, function(err, usersCount){
		Poll.count({}, function(err, pollsCount) {
			Poll.count({'state': 'opened'}, function(err, pollsCountOpened) {
				res.format({
					'application/json': function() {
					  res.send({'usersCount': usersCount, 'pollsCount': pollsCount, 'openPollsCount': pollsCountOpened});
					}
				});
			});
		});
	});
});