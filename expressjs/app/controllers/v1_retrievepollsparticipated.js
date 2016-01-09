var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var common = require(__dirname + '/../common/common.js');

// Mongoose schemas
var User = mongoose.model('User');

module.exports = function (app) {
  app.use('/api/v1', router);
};

// Retrieve the polls the user joined
router.get('/participations', function (req, res) {
	var authorizationHeader = req.headers['authorization'];
	
	var errors = [];
	var dataRespondToClient = {};
	var respondCallback = function () { common.respondToUser(res, errors, dataRespondToClient); };
	
	common.checkAndExtractFromSessionToken(authorizationHeader,
									function(userId) {
										
										User.findOne({ "_id": userId }).select("participation_polls -_id").populate('participation_polls', 'state name').exec(function (err, user) {
											console.log(user);
											dataRespondToClient = { "polls": user.participation_polls };
											respondCallback();
										});

									},
									function() {
										errors.push(common.erro('E_INVALID_SESSION', 'Invalid or no session provided'));
										respondCallback();
									});
});