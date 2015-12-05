var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var common = require(__dirname + '/../common/common.js');

// Mongoose schemas
var Poll = mongoose.model('Poll');

module.exports = function (app) {
  app.use('/api/v1', router);
};

// Retrieve my polls
router.get('/polls', function (req, res) {
	var authorizationHeader = req.headers['authorization'];
	
	var errors = [];
	var dataRespondToClient = {};
	var respondCallback = function () { common.respondToUser(res, errors, dataRespondToClient); };
	
	common.checkAndExtractFromSessionToken(authorizationHeader,
									function(userId) {
										
										// Selecting all polls created by the user requesting his polls
										Poll.find({ created_by: userId }, '_id state creation_date name', function (err, userPolls){
											dataRespondToClient = userPolls;
											respondCallback();
										});
									},
									function() {
										errors.push(common.erro('E_INVALID_SESSION', 'Invalid or no session provided'));
										respondCallback();
									});
});