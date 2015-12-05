var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var common = require(__dirname + '/../common/common.js');

// Mongoose schemas
var Poll = mongoose.model('Poll');

module.exports = function (app) {
  app.use('/api/v1', router);
};

// Create new poll
router.post('/poll', function (req, res) {

	var authorizationHeader = req.headers['authorization'];
	
	var errors = [];
	var respondCallback = function () { common.respondToUser(res, errors, {}); };
	
	common.checkAndExtractFromSessionToken(authorizationHeader,
									function(userId) {
										// First, we make sure the submitted form is acceptable
										common.checkPoll(req.body, function(newPollDTO) {
											var insertPoll = function(pollId) {
												console.log('Adding new poll');
												
												// TO-DO: factor that code
												var newPoll = new Poll({ '_id': pollId,
																		 'state': 'pending',
																		 'created_by': userId,
																		 'creation_date': new Date(),
																		 'name': newPollDTO.name });
																		 
												newPoll.questions = [];

												for (var indexQuestion = 0 ; indexQuestion < newPollDTO.questions.length; indexQuestion++) {
													var currentQuestion = newPollDTO.questions[indexQuestion];
													var currentQuestionToAdd = { '_id': pollId + '-' + indexQuestion,
																				 'name': currentQuestion.name,
																				 'maxVote': currentQuestion.maxVote,
																				 'allowAnonymous': currentQuestion.allowAnonymous,
																				 'timeout': currentQuestion.timeout,
																				 'answers': []
																				};
													
													for (var indexAnswer = 0 ; indexAnswer < currentQuestion.answers.length; indexAnswer++) {
														var currentAnswer = currentQuestion.answers[indexAnswer];
														currentQuestionToAdd.answers.push({'_id': pollId + '-' + indexQuestion + '-' + indexAnswer,
																						   'name': currentAnswer.name,
																						   'users': []});
													}
													
													newPoll.questions.push(currentQuestionToAdd);
												}


												// The new poll is saved in the database
												newPoll.save(function (err, newPollInserted) {
													if (err) {
														console.log(err);
														errors.push(common.erro('E_GENERIC_ERROR', 'Cannot add poll'));
													} else {
														console.log('Poll added');
													}
													
													respondCallback();
												});
											};
											
											// We then generate a hopefully random identifier, which will identify the new poll
											common.generateId(function(generatedPollId) {
												insertPoll(generatedPollId);
											});
											
										}, function(errs) {
											errors = errs;
											respondCallback();
										});
									},
									function() {
										errors.push(common.erro('E_INVALID_SESSION', 'Invalid or no session provided'));
										respondCallback();
									});
});