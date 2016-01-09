var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var common = require(__dirname + '/../common/common.js');

// Mongoose schemas
var Poll = mongoose.model('Poll');

module.exports = function (app) {
  app.use('/api/v1', router);
};

// Duplicate a poll
router.post('/poll/:id/duplicate', function (req, res) {
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
											  respondCallback();
										  } else {
											 // Only the owner of a poll can request it
											 if (common.checkStringTimeConst(poll.created_by, userId)) {

												common.generateId(function(generatedPollId) {
													var filteredPoll = poll.toObject();
													filteredPoll._id = generatedPollId; // Assigning a new identifier to this poll
													filteredPoll.state = 'pending';
													filteredPoll.creation_date = new Date();
													filteredPoll.name = "Duplicated: " + filteredPoll.name;
		
													var questionsCount = filteredPoll.questions.length;
													for (var i=0; i<questionsCount;i++) {
														filteredPoll.questions[i]._id = generatedPollId + '-' + i;
														
														var answersCount = filteredPoll.questions[i].answers.length;
														for (var y=0; y<answersCount;y++) {
															filteredPoll.questions[i].answers[y]._id = generatedPollId + '-' + filteredPoll.questions[i]._id + '-' + y;
															filteredPoll.questions[i].answers[y].users = [];
														}
													}
													
													console.log(filteredPoll);
											 
													var newPoll = new Poll(filteredPoll);
													
													newPoll.save(function (err, newPollInserted) {
														if (err) {
															console.log(err);
															errors.push(common.erro('E_GENERIC_ERROR', 'Cannot add poll'));
														} else {
															dataRespondToClient = filteredPoll._id;
															console.log('Poll added');
														}
														
														respondCallback();
													});
												});
											 } else {
												console.log('Refused: user ' + userId + ' requested poll ' + pollIdToRetrieve);
												errors.push(common.erro('E_UNAUTHORIZED', 'You did not create this poll'));
												respondCallback();
											 }
										  }
										});
									},
									function() {
										errors.push(common.erro('E_INVALID_SESSION', 'Invalid or no session provided'));
										respondCallback();
									});
});