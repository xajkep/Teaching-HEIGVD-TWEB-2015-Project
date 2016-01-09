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
											  errors.push(common.erro('E_INVALID_IDENTIFIER', 'Poll not found'));
										  } else {
											  var respondWithPollData = function() {
												// The poll cannot be viewed if it is already finished or currently opened
												if (poll.state == 'opened' || poll.state == 'closed') {
													errors.push(common.erro('E_INVALID_STATE', 'The state is not opened or closed'));
													respondCallback();
												} else {
													// We then return only selected fields to the user
													var filteredPoll = poll.toObject();

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
																delete currentUser._id;
																
																// If the user voted anonymously, his id is removed from the response
																if (currentUser.anonymous) {
																	delete currentUser.user;
																}
															}
														}
													}

													dataRespondToClient = filteredPoll;
													respondCallback();													
												}
											  };
											  
											  var respondWithUnauthorized = function() {
												  console.log('Refused: user ' + userId + ' requested poll ' + pollIdToRetrieve);
												  errors.push(common.erro('E_UNAUTHORIZED', 'You are not allowed'));
												  respondCallback();
											  };
											  
											  
											  var userRequestingIsThePollCreator = common.checkStringTimeConst(poll.created_by, userId);

											  // If the user requesting the poll is the creator, he can retrieve the poll
											  if (userRequestingIsThePollCreator) {
												  respondWithPollData();
											  } else {
												// If the user requesting the poll is not creator, he can only retrieve the poll if he participated in the poll
												User.findOne({ '_id': userId, 'participation_polls': pollIdToRetrieve }, '_id', function (err, userFound) {
													if (err || userFound !== null) {
														respondWithPollData();
													} else {
														respondWithUnauthorized();
													}
												});
											  }
										  }
										});
									},
									function() {
										errors.push(common.erro('E_INVALID_SESSION', 'Invalid or no session provided'));
										respondCallback();
									});
});