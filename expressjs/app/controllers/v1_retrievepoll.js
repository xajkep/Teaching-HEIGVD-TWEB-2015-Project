var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var common = require(__dirname + '/../common/common.js');

// Mongoose schemas
var Poll = mongoose.model('Poll');

module.exports = function (app) {
  app.use('/api/v1', router);
};

// Get a poll
router.get('/poll/:id', function (req, res) {
	var pollIdToRetrieve = req.params.id;
	var authorizationHeader = req.headers['authorization'];
	
	var errors = [];
	var dataRespondToClient = {};
	var respondCallback = function () { common.respondToUser(res, errors, dataRespondToClient); };
	
	common.checkAndExtractFromSessionToken(authorizationHeader,
									function(userId) {
										// populate() will resolve "foreign keys"
										Poll.findOne({ '_id': pollIdToRetrieve }).populate('questions.answers.users.user', '_id email firstname lastname').exec(function (err, poll){
										  if (err || poll == null) {
											  console.log('User ' + userId + ' requested the non existing poll: ' + pollIdToRetrieve + ' err: ' + err);
											  errors.push(common.erro('E_INVALID_IDENTIFIER', 'Poll not found'));
										  } else {
											 // Only the owner of a poll can request it
											 if (common.checkStringTimeConst(poll.created_by, userId)) {
												// The poll cannot be viewed if it is already finished or currently opened
												if (poll.state == 'opened' || poll.state == 'closed') {
													errors.push(common.erro('E_INVALID_STATE', 'The state is not opened or closed'));
												} else {
													// We then return only selected fields to the user
													var filteredPoll = poll.toObject();
													 
													console.log('Responding with poll: ' + poll._id);
													
													var questionsCount = filteredPoll.questions.length;
													for (var i=0; i<questionsCount;i++) {
														var currentQuestion = filteredPoll.questions[i];
														var answersCount = currentQuestion.answers.length;
														for (var y=0; y<answersCount;y++) {
															var currentAnswer = currentQuestion.answers[y];
		
															var usersCount = currentAnswer.users.length;
															for (var z=0;z<usersCount;z++) {
																var currentUser = currentAnswer.users[z];
																
																// Since mongoose did a join, the _id whould be a duplicate. It is removed once.
																//console.log('deleting currentUser._id: ' + currentUser._id);
																delete currentUser._id;
																
																// If the user voted anonymously, his id is removed from the response
																if (currentUser.anonymous) {
																	//console.log('deleting currentUser.user: ' + currentUser.user);
																	delete currentUser.user;
																}
															}
														}
													}

													dataRespondToClient = filteredPoll;
												}
											 } else {
												console.log('Refused: user ' + userId + ' requested poll ' + pollIdToRetrieve);
												errors.push(common.erro('E_UNAUTHORIZED', 'You did not create this poll'));
											 }
											 
											 respondCallback();
										  }
										});
									},
									function() {
										errors.push(common.erro('E_INVALID_SESSION', 'Invalid or no session provided'));
										respondCallback();
									});
});