var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var common = require(__dirname + '/../common/common.js');

// Mongoose schemas
var Poll = mongoose.model('Poll');
var User = mongoose.model('User');

module.exports = function (app) {
  app.use('/api/v1', router);
};

// Search users by email
router.get('/users/email/:email', function (req, res) {
	
	// The email to search for
	var emailToSearch = req.params.email;
	var authorizationHeader = req.headers['authorization'];
	
	var errors = [];
	var dataRespondToClient = [];
	var respondCallback = function () { common.respondToUser(res, errors, dataRespondToClient); };
	
	common.checkAndExtractFromSessionToken(authorizationHeader,
									function(userId) {
										if (emailToSearch.length >= 3) {
											// email LIKE 'emailToSearch%'
											User.find({ email: new RegExp('^' + emailToSearch, 'i') }).select('_id email').limit(15).exec(function (err, users) {
												
												var retrieved = 0;
												var usersCount = users.length;
												var currentUsers = {};
												for (var i=0; i < usersCount; i++) {
													currentUsers[users[i]._id] = {
														'email': users[i].email,
														'polls': []
													};

													Poll.find({ 'created_by': users[i]._id, 'state': 'opened' }).select('_id created_by name creation_date').exec(function (err, polls) {
														
														if (polls.length > 0) {
															
															var pollsToAdd = [];
															
															for (var z=0;z<polls.length;z++) {
																var p = polls[z].toObject();
																delete p.created_by;
																
																pollsToAdd.push(p);
															}
															
															currentUsers[polls[0].created_by].polls = pollsToAdd;
														}
														
														// Once we have received all opened from this specific user, we respond to the request
														if (++retrieved == users.length) {
															
															for (var k in currentUsers) {
																dataRespondToClient.push(currentUsers[k]);
															}
															
															respondCallback();
														}
													});
												}
											});
										} else {
											errors.push(common.erro('E_INVALID_REQUEST', 'Email is too short'));
											respondCallback();
										}
									},
									function() {
										errors.push(common.erro('E_INVALID_SESSION', 'Invalid or no session provided'));
										respondCallback();
									});
});