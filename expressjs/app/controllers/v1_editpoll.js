var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var common = require(__dirname + '/../common/common.js');

// Mongoose schemas
var Poll = mongoose.model('Poll');

module.exports = function (app) {
  app.use('/api/v1', router);
};

// Edit a poll
router.put('/poll/:id', function (req, res) {
	
	// The poll to edit is specified as query string parameter
	var pollIdToEdit = req.params.id;

	var authorizationHeader = req.headers['authorization'];
	
	var errors = [];
	var respondCallback = function () { common.respondToUser(res, errors, {}); };
	
	common.checkAndExtractFromSessionToken(authorizationHeader,
									function(userId) {
										
										// First, we check if the requested poll exists
										Poll.findOne({ '_id': pollIdToEdit }, 'state created_by', function(err, poll) {
											if (err || poll == null) {
												console.log(err);
												errors.push(common.erro('E_INVALID_IDENTIFIER', 'Poll not found'));
												respondCallback();
											} else {
												// We check the owner of the poll, which must be the id doing the request
												if (!common.checkStringTimeConst(poll.created_by, userId)) {
													errors.push(common.erro('E_UNAUTHORIZED', 'You did not create this poll'));
												} else {
													// A poll can only be edited in the pending state. Any other state and the edit is denied.
													if (poll.state != "pending") {
														errors.push(common.erro('E_INVALID_STATE', 'Poll is not in the pending state'));
														respondCallback();
													} else {
														// The poll's parameters and required values are checked
														common.checkPoll(req.body, function(newPollDTO) {
															console.log('Editing existing poll');
															
															// TO-DO: factor that code
															var newPoll = new Poll({ '_id': pollIdToEdit,
																					 'state': 'pending',
																					 'created_by': userId,
																					 'creation_date': new Date(),
																					 'name': newPollDTO.name });
																					 
															newPoll.questions = [];

															for (var indexQuestion = 0 ; indexQuestion < newPollDTO.questions.length; indexQuestion++) {
																var currentQuestion = newPollDTO.questions[indexQuestion];
																var currentQuestionToAdd = { '_id': pollIdToEdit + '-' + indexQuestion,
																							 'name': currentQuestion.name,
																							 'maxVote': currentQuestion.maxVote,
																							 'allowAnonymous': currentQuestion.allowAnonymous,
																							 'timeout': currentQuestion.timeout,
																							 'answers': []
																							};
																
																for (var indexAnswer = 0 ; indexAnswer < currentQuestion.answers.length; indexAnswer++) {
																	var currentAnswer = currentQuestion.answers[indexAnswer];
																	currentQuestionToAdd.answers.push({'_id': pollIdToEdit + '-' + indexQuestion + '-' + indexAnswer,
																									   'name': currentAnswer.name,
																									   'users': []});
																}
																
																newPoll.questions.push(currentQuestionToAdd);
															}

															// Updating the poll in database
															Poll.update({ '_id': pollIdToEdit }, newPoll, function(err) {
																if (err) {
																	console.log(err);
																	errors.push(common.erro('E_GENERIC_ERROR', 'Cannot edit poll'));
																} else {
																	console.log('Poll edited');
																}
																
																respondCallback();
															});
															
														}, function(errs) {
															errors = errs;
															respondCallback();
														});
														
													}
												}
											}
										});
									},
									function() {
										errors.push(common.erro('E_INVALID_SESSION', 'Invalid or no session provided'));
										respondCallback();
									});
	
});