/*
This file contains all REST and Socket.IO v1 APIs
*/
var express = require('express');
var crypto = require('crypto');
var router = express.Router();
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var globals = require(__dirname + '/../inmemory/globals.js'); // Our globals.js file
var appjs = require(__dirname + '/../../app.js');
var sio = appjs.sio;
var sessionSecret = appjs.sessionSecret;
var validator = require('validator');

// Mongoose schemas
var User = mongoose.model('User');
var Poll = mongoose.model('Poll');

module.exports = function (app) {
  app.use('/api/v1', router);
};

// Socket.IO endpoint
sio.sockets.on('connection', function (socket) {
	socket.isAuthenticated = false;
	console.log('New socket.io connection');

	// A socket.io client disconnected
	socket.on('disconnect', function() {
		console.log("User disconnected");

		if (socket.isAuthenticated === true) {
			sio.to('poll_' + socket.pollId + '_speaker').emit('userDisconnect', socket.userId);
		}
	});

	// A socket.io client is ready to catch up
	socket.on('catchUp', function() {
		if (socket.isAuthenticated === true) {

			// false = error | null = poll not started | obj = current question
			var currentQuestion = globals.getCurrentQuestion(socket.pollId, socket.userId);

			// On speaker re-join, we send him the list of the audience
			if (currentQuestion !== null && currentQuestion !== false && socket.isSpeaker === true) {
				var audienceInRoom = [];

				for (var socketId in sio.nsps['/'].adapter.rooms['poll_' + socket.pollId + '_audience']){
					var socketInRoom = sio.sockets.connected[socketId];

					audienceInRoom.push({ '_id': socketInRoom.userId, 'firstName': socketInRoom.firstName, 'lastName': socketInRoom.lastName, 'email': socketInRoom.email, 'voted': (currentQuestion.question.allowAnonymous ? null : socketInRoom.voted) });
				}

				console.log('audienceList=');
				console.log(audienceInRoom);
				socket.emit('audienceList', audienceInRoom);
			}



			// If the poll has started, catching up
			if (currentQuestion !== null) {
				socket.voted = currentQuestion.voted > 0;
				console.log('Catching up on question. Time remaining: ' + currentQuestion.timeout);
				socket.emit('nextQuestion', currentQuestion);
			}

			// On speaker re-join, we send him the current live voting results
			if (socket.isSpeaker === true) {
				var liveResults = globals.getLiveResults(socket.pollId);
				console.log('Live vote results: ' + liveResults);

				socket.emit('liveVoteResults', { 'results': liveResults, 'whovoted': null, 'timing': null });
			} else {

				var voted = null;

				if (currentQuestion == null || currentQuestion == false) {
					voted = false;
				} else {
					if (!currentQuestion.question.allowAnonymous) {
						voted = socket.voted;
					}
				}

				sio.to('poll_' + socket.pollId + '_speaker').emit('userConnect',
																  { '_id': socket.userId, 'firstName': socket.firstName, 'lastName': socket.lastName, 'email': socket.email, 'voted': voted });
			}

			// Joining either the speaker or the audience room
			socket.join('poll_' + socket.pollId + '_' + (socket.isSpeaker === true ? 'speaker' : 'audience'));

			var pollDetails = globals.getPollDetails(socket.pollId);
			socket.emit('pollDetails', pollDetails);
		}
	});

	// First message any socket.io client should send
	socket.on('authAndJoin', function(authData) {
		console.log('Processing authAndJoin');

		// Validating the submitted session token
		checkAndExtractFromSessionToken(authData.session,
										function(userId) {

											var joinPollResult = globals.userJoinPoll(authData.poll, userId);

											if (joinPollResult === false) {
												console.log('ERROR: cannot join poll');
												var errors = [];
												errors.push(erro('E_INVALID_IDENTIFIER', 'The specified poll does not exist or is not opened'));
												socket.emit('authAndJoinResult', {'status': 'ko', 'messages': errors});
											} else {
												console.log('Socket.io authentication success');

<<<<<<< HEAD
=======
												// TO-DO: check if user is already connected. If so, disconnect all other sessions.

>>>>>>> 38698a7cc92b9968508b045a9bda221acb83e121
												User.findOne({ '_id': userId }, function (err, user) {
												  if (err || user == null) {
													  // Should never happen
													  console.log('Invalid user id provided');
												  } else {

														// Disconnecting others sessions the same user might already have
														for (var socketId in sio.nsps['/'].adapter.rooms['poll_' + authData.poll + '_audience']){
															var socketInRoom = sio.sockets.connected[socketId];

															if (socketInRoom.userId == userId) {
																console.log('Diconnecting duplicate session');
																socketInRoom.emit('duplicateConnection');
																socketInRoom.disconnect();
															}
														}

														socket.isAuthenticated = true;
														socket.userId = userId;
														socket.firstName = user.firstname;
														socket.lastName = user.lastname;
														socket.email = user.email;
														socket.pollId = authData.poll;
														socket.isSpeaker = (joinPollResult == 'speaker');
														socket.voted = false;

														// Joining the common room
														socket.join('poll_' + authData.poll);

														// Joining the type specific room. joinPollResult = 'speaker|audience'
														socket.emit('authAndJoinResult', {'status': 'ok', 'data': joinPollResult});
														
														console.log('authAndJoin success: user=' + socket.email + ' (' + socket.userId + ')poll=' + socket.pollId);
												  }
												});
											}
										},
										function() {
											console.log('Socket.io authentication failure');
											var errors = [];
											errors.push(erro('E_UNAUTHORIZED', 'You are either not authenticated or not a speaker'));
											socket.emit('authAndJoinResult', {'status': 'ko', 'messages': errors});
										});
	});

	// A speaker wants to display the next question in the poll
	socket.on('goNextQuestion', function() {
		console.log('Processing goNextQuestion');

		if (socket.isAuthenticated === true && socket.isSpeaker === true) {
			for (var socketId in sio.nsps['/'].adapter.rooms['poll_' + socket.pollId + '_audience']){
				sio.sockets.connected[socketId].voted = false;
			}

			globals.goNextQuestion(socket.pollId,
			                       function(nextQuestion, timeout, number, total) {
									   // Next question (timer is running)
									   sio.to('poll_' + socket.pollId).emit('nextQuestion', { 'question': nextQuestion, 'voted': 0, 'timeout': timeout, 'current': (number + 1), 'total': total });
									   console.log('Notified clients: next question data');
								   },
								   function(cb) {
									   // Poll completed
									   sio.to('poll_' + socket.pollId).emit('pollCompleted');
									   console.log('Notified clients: poll completed');
									   cb();
								   },
								   function() {
									   // Question timeout
									   sio.to('poll_' + socket.pollId).emit('votingOnThisQuestionEnded');
									   console.log('Notified clients: question timeout');
								   },
								   function() {
									   console.log('ERROR: cannot move to the next question');
								   });
		} else {
			var errors = [];
			errors.push(erro('E_UNAUTHORIZED', 'You are either not authenticated or not a speaker'));
			socket.emit('goNextQuestionResult', {'status': 'ko', 'messages': errors});
		}
	});

	// A socket.io client wants to cast a vote
	socket.on('vote', function(data) {
		var answerIndex = data.answerIndex;
		var voteAsAnonymous = data.voteAsAnonymous;

		console.log('Processing vote');

		// Must be authenticated. Speakers cannot cast a vote.
		if (socket.isAuthenticated === true && socket.isSpeaker !== true) {

			// Registering the vote
			globals.vote(socket.pollId, answerIndex, socket.userId, voteAsAnonymous,
						function(timing, voteRegisteredAsAnonymous) {
							// Vote registered
							console.log('Vote registered');
							socket.voted = true;
							socket.emit('voteResult', {'status': 'ok'});

							// Retrieving live voting results to send to speakers
							var liveResults = globals.getLiveResults(socket.pollId);

							// Hiding the user id if the vote was registered as anonymous
							var whoVoted = voteRegisteredAsAnonymous ? null : socket.userId;

							sio.to('poll_' + socket.pollId + '_speaker').emit('liveVoteResults', { 'results': liveResults, 'whovoted': whoVoted, 'timing': timing });
						}, function() {
							// An error occured during the vote registration
							var errors = [];
							errors.push(erro('E_GENERIC_ERROR', 'A generic error occured'));
							socket.emit('voteResult', {'status': 'ko', 'messages': errors});
						});
		} else {
			var errors = [];
			errors.push(erro('E_UNAUTHORIZED', 'You are not authenticated'));
			socket.emit('voteResult', {'status': 'ko', 'messages': errors});
		}
	});
});

/*
Function called when a poll has just been closed.
Since the poll is not closed, every socket.io instance is disconnected
*/
function toDoWhenPollIsClosed(pollId) {
	console.log('Poll is closed. Disconnecting sockets.');

	for (var socketId in sio.nsps['/'].adapter.rooms['poll_' + pollId]){
		var socketInRoom = sio.sockets.connected[socketId];

		socketInRoom.disconnect();
	}
}

// Open a poll
router.post('/poll/opened/:id', function (req, res) {
	var pollIdToOpen = req.params.id;
	var authorizationHeader = req.headers['authorization'];

	var errors = [];
	var dataRespondToClient = {};
	var respondCallback = function () { respondToUser(res, errors, dataRespondToClient); };

	checkAndExtractFromSessionToken(authorizationHeader,
									function(userId) {
										// First, check that the requested poll exists
										Poll.findOne({ '_id': pollIdToOpen }, function (err, poll) {
										  if (err || poll == null) {
											  errors.push(erro('E_INVALID_IDENTIFIER', 'Poll not found'));
										  } else {
											 // Only the user who created the poll can open it
											 if (checkStringTimeConst(poll.created_by, userId)) {
												// The poll can only be opened in the pending state
												if (poll.state == 'pending') {

													// This call will set state=opened in the database
													if (!globals.loadPollInMemory(poll, function() {
														toDoWhenPollIsClosed(poll._id);
													})) {
														errors.push(erro('E_GENERIC_ERROR', 'Cannot load poll in memory'));
													}

												} else {
													errors.push(erro('E_INVALID_STATE', 'The poll is not in pending state'));
												}
											 } else {
												 errors.push(erro('E_UNAUTHORIZED', 'You did not create this poll'));
											 }
										  }

										  respondCallback();
										});
									},
									function() {
										errors.push('Invalid or no session provided');
										respondCallback();
									});
});

// Retrieve my polls
router.get('/polls', function (req, res) {
	var authorizationHeader = req.headers['authorization'];

	var errors = [];
	var dataRespondToClient = {};
	var respondCallback = function () { respondToUser(res, errors, dataRespondToClient); };

	checkAndExtractFromSessionToken(authorizationHeader,
									function(userId) {

										// Selecting all polls created by the user requesting his polls
										Poll.find({ created_by: userId }, '_id state creation_date name', function (err, userPolls){
											dataRespondToClient = userPolls;
											respondCallback();
										});
									},
									function() {
										errors.push(erro('E_INVALID_SESSION', 'Invalid or no session provided'));
										respondCallback();
									});
});

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

// Search users by email
router.get('/users/email/:email', function (req, res) {

	// The email to search for
	var emailToSearch = req.params.email;
	var authorizationHeader = req.headers['authorization'];

	var errors = [];
	var dataRespondToClient = [];
	var respondCallback = function () { respondToUser(res, errors, dataRespondToClient); };

	checkAndExtractFromSessionToken(authorizationHeader,
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
											errors.push(erro('E_INVALID_REQUEST', 'Email is too short'));
											respondCallback();
										}
									},
									function() {
										errors.push(erro('E_INVALID_SESSION', 'Invalid or no session provided'));
										respondCallback();
									});
});

// Get a poll
router.get('/poll/:id', function (req, res) {
	var pollIdToRetrieve = req.params.id;
	var authorizationHeader = req.headers['authorization'];

	var errors = [];
	var dataRespondToClient = {};
	var respondCallback = function () { respondToUser(res, errors, dataRespondToClient); };

	checkAndExtractFromSessionToken(authorizationHeader,
									function(userId) {
										// populate() will resolve "foreign keys"
										Poll.findOne({ '_id': pollIdToRetrieve }).populate('questions.answers.users.user', '_id email firstname lastname').exec(function (err, poll){
										  if (err || poll == null) {
											  console.log('User ' + userId + ' requested the non existing poll: ' + pollIdToRetrieve + ' err: ' + err);
											  errors.push(erro('E_INVALID_IDENTIFIER', 'Poll not found'));
										  } else {
											 // Only the owner of a poll can request it
											 if (checkStringTimeConst(poll.created_by, userId)) {
												// The poll cannot be viewed if it is already finished or currently opened
												if (poll.state == 'opened' || poll.state == 'closed') {
													errors.push(erro('E_INVALID_STATE', 'The state is not opened or closed'));
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
												errors.push(erro('E_UNAUTHORIZED', 'You did not create this poll'));
											 }

											 respondCallback();
										  }
										});
									},
									function() {
										errors.push(erro('E_INVALID_SESSION', 'Invalid or no session provided'));
										respondCallback();
									});
});

// Delete a poll
router.delete('/poll/:id', function (req, res) {

	// The poll to delete is a parameter
	var pollIdToDelete = req.params.id;

	var authorizationHeader = req.headers['authorization'];

	var errors = [];
	var newPollDTO = {};
	var respondCallback = function () { respondToUser(res, errors, {}); };

	checkAndExtractFromSessionToken(authorizationHeader,
									function(userId) {
										Poll.findOne({ _id: pollIdToDelete }, 'state created_by', function (err, poll){
										  if (poll == null) {
											  errors.push(erro('E_INVALID_IDENTIFIER', 'Poll not found'));
											  respondCallback();
										  } else {
											 // Only the owner of a poll can delete it
											 if (checkStringTimeConst(poll.created_by, userId)) {

												// If the poll is currently opened, it must be closed by either:
												// - finishing it by responding to all of its questions
												// - wait for the hard timeout, which will close it automatically
												if (poll.state == 'opened') {
													errors.push(erro('E_INVALID_STATE', 'The poll is currently opened'));
													respondCallback();
												} else {
													// Removing the poll
													Poll.remove({ _id: pollIdToDelete }, function(err) {

														if (err) {
															errors.push(erro('E_GENERIC_ERROR', 'Cannot delete poll'));
														}

														respondCallback();
													});
												}
											 } else {
												errors.push(erro('E_UNAUTHORIZED', 'You did not create this poll'));
												respondCallback();
											 }
										  }
										});
									},
									function() {
										errors.push(erro('E_INVALID_SESSION', 'Invalid or no session provided'));
										respondCallback();
									});
});

// Edit a poll
router.put('/poll/:id', function (req, res) {

	// The poll to edit is specified as query string parameter
	var pollIdToEdit = req.params.id;

	var authorizationHeader = req.headers['authorization'];

	var errors = [];
	var respondCallback = function () { respondToUser(res, errors, {}); };

	checkAndExtractFromSessionToken(authorizationHeader,
									function(userId) {

										// First, we check if the requested poll exists
										Poll.findOne({ '_id': pollIdToEdit }, 'state created_by', function(err, poll) {
											if (err || poll == null) {
												console.log(err);
												errors.push(erro('E_INVALID_IDENTIFIER', 'Poll not found'));
												respondCallback();
											} else {
												// We check the owner of the poll, which must be the id doing the request
												if (!checkStringTimeConst(poll.created_by, userId)) {
													errors.push(erro('E_UNAUTHORIZED', 'You did not create this poll'));
												} else {
													// A poll can only be edited in the pending state. Any other state and the edit is denied.
													if (poll.state != "pending") {
														errors.push(erro('E_INVALID_STATE', 'Poll is not in the pending state'));
														respondCallback();
													} else {
														// The poll's parameters and required values are checked
														checkPoll(req.body, function(newPollDTO) {
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
																	errors.push(erro('E_GENERIC_ERROR', 'Cannot edit poll'));
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
										errors.push(erro('E_INVALID_SESSION', 'Invalid or no session provided'));
										respondCallback();
									});

});

/*
This function will check the poll:
- all required fields must be present
- all fields must conform to their constraints (see REST documentation)

If the supplied form is conform, the cbWhenOK callback is called without parameter
If there is one or more errors, the cbWhenKO callback is called, and an array of errors is received as parameter
*/
function checkPoll(poll, cbWhenOK, cbWhenKO) {
	var pollName;
	var errors = [];
	var newPollDTO = [];

	if (!poll.hasOwnProperty("name")) {
		errors.push(erro('E_INVALID_REQUEST', "Poll name not supplied"));
	} else {
		pollName = poll.name;

		if (pollName.length < 3 || pollName.length > 30) {
			errors.push(erro('E_INVALID_REQUEST', "Poll name is invalid"));
		}
	}

	if (!poll.hasOwnProperty("questions")) {
		errors.push(erro('E_INVALID_REQUEST', "Poll questions not supplied"));
	} else {
		newPollDTO.name = pollName;
		newPollDTO.questions = [];

		var questionsCount = poll.questions.length;
		if (questionsCount < 1) {
			errors.push(erro('E_INVALID_REQUEST', "At least one question must be specified"));
		} else if (questionsCount > 50) {
			errors.push(erro('E_INVALID_REQUEST', "Too many questions specified"));
		} else {

			for (var questionIndex = 0; questionIndex < poll.questions.length ; questionIndex++) {
				var currentQuestionDTO = {};
				var currentQuestion = poll.questions[questionIndex];

				if (!currentQuestion.hasOwnProperty("name")) {
					errors.push(erro('E_INVALID_REQUEST', "Question has no name"));
					break;
				}

				if (!currentQuestion.hasOwnProperty("allowAnonymous")) {
					errors.push(erro('E_INVALID_REQUEST', "Question has no allowAnonymous"));
					break;
				}

				if (!currentQuestion.hasOwnProperty("maxVote")) {
					errors.push(erro('E_INVALID_REQUEST', "Question has no maxVote"));
					break;
				}

				if (!currentQuestion.hasOwnProperty("answers")) {
					errors.push(erro('E_INVALID_REQUEST', "Question has no answers"));
					break;
				}

				if (!currentQuestion.hasOwnProperty("timeout")) {
					errors.push(erro('E_INVALID_REQUEST', "Question has no timeout"));
					break;
				}

				var currentQuestionName = currentQuestion.name;
				var currentQuestionAllowAnonymous = currentQuestion.allowAnonymous;
				var currentQuestionMaxVotes = currentQuestion.maxVote;
				var currentQuestionTimeout = currentQuestion.timeout;
				var currentQuestionAnswers = currentQuestion.answers;

				currentQuestionDTO.name = currentQuestionName;
				currentQuestionDTO.allowAnonymous = currentQuestionAllowAnonymous;
				currentQuestionDTO.maxVote = currentQuestionMaxVotes;
				currentQuestionDTO.timeout = currentQuestionTimeout;
				currentQuestionDTO.answers = [];

				console.log("Question: " + currentQuestionName);
				console.log(" allowAnonymous: " + currentQuestionDTO.allowAnonymous);
				console.log(" maxVote: " + currentQuestionDTO.maxVote);
				console.log(" timeout: " + currentQuestionDTO.timeout);

				if (currentQuestionDTO.name.length < 5 || currentQuestionDTO.name.length > 50) {
					errors.push(erro('E_INVALID_REQUEST', "Question name is invalid"));
				}

				if (currentQuestionDTO.allowAnonymous !== true && currentQuestionDTO.allowAnonymous !== false) {
					errors.push(erro('E_INVALID_REQUEST', "AllowAnonymous is invalid"));
				}

				if (currentQuestionDTO.maxVote < 1 || currentQuestionDTO.maxVote > 10) {
					errors.push(erro('E_INVALID_REQUEST', "MaxVote is invalid"));
				}

				if (currentQuestionDTO.timeout < 15 || currentQuestionDTO.timeout > 600) {
					errors.push(erro('E_INVALID_REQUEST', "Timeout is invalid"));
				}

				var answersCount = currentQuestionAnswers.length;
				if (answersCount < 2) {
					errors.push(erro('E_INVALID_REQUEST', "At least two answers must be specified"));
				} else if (answersCount > 10) {
					errors.push(erro('E_INVALID_REQUEST', "Too many answers specified"));
				} else {
					console.log("  Answers:");

					for (var answerIndex = 0; answerIndex < currentQuestionAnswers.length ; answerIndex++) {
						var currentAnswerDTO = {};
						var currentAnswer = currentQuestionAnswers[answerIndex];

						if (!currentQuestion.hasOwnProperty("name")) {
							errors.push(erro('E_INVALID_REQUEST', "Answer has no name"));
							break;
						}

						var currentAnswerName = currentAnswer.name;
						currentAnswerDTO.name = currentAnswerName;

						console.log("    Answer: " + currentAnswerName);

						currentQuestionDTO.answers.push(currentAnswerDTO);
					}
				}

				newPollDTO.questions.push(currentQuestionDTO);

				if (errors.length > 0) {
					break;
				}
			}
		}

    //debug
		//console.log("newPollDTO: %j", newPollDTO);
	}

	if (errors.length != 0) {
		cbWhenKO(errors);
	} else {
		cbWhenOK(newPollDTO);
	}
}

// Create new poll
router.post('/poll', function (req, res) {

	var authorizationHeader = req.headers['authorization'];

	var errors = [];
	var respondCallback = function () { respondToUser(res, errors, {}); };

	checkAndExtractFromSessionToken(authorizationHeader,
									function(userId) {
										// First, we make sure the submitted form is acceptable
										checkPoll(req.body, function(newPollDTO) {
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
														errors.push(erro('E_GENERIC_ERROR', 'Cannot add poll'));
													} else {
														console.log('Poll added');
													}

													respondCallback();
												});
											};

											// We then generate a hopefully random identifier, which will identify the new poll
											generateId(function(generatedPollId) {
												insertPoll(generatedPollId);
											});

										}, function(errs) {
											errors = errs;
											respondCallback();
										});
									},
									function() {
										errors.push(erro('E_INVALID_SESSION', 'Invalid or no session provided'));
										respondCallback();
									});

});

/*
This function receives two parameters:
- An error identifier
- A short explanation of the error

and returns an error object (as explained in the REST documentation), ready to be put in an array and returned to the client
*/
function erro(error, description) {
	return { 'error': error, 'description': description}
}

/*
This function will check the supplied password.
It must be conform to all security requirements.

There requirements are:
- The length of the password must be at least 8 characters

Returns an array of error messages. An empty array mean the provided password is conform to the policy.
*/
function checkPasswordAgainstPolicy(password) {
	var errors = [];
	var minPasswordLength = 8;

	if (password.length < minPasswordLength) {
		errors.push(erro('E_BAD_PASSWORD', 'Password must be at least ' + minPasswordLength + ' chars in length'));
	}

	return errors;
}

// New user account
router.post('/registerForm', function (req, res) {
	var errors = [];

	// Checking that all required attributes have been submitted

	if (!req.body.hasOwnProperty("email")) {
		errors.push(erro("E_INVALID_REQUEST", "Email not supplied"));
	} else {
		var emailLen = req.body.email.length;
		if (emailLen < 5 || emailLen > 70) {
			errors.push(erro("E_INVALID_REQUEST", "Email length is invalid"));
		} else {
			if (!validator.isEmail(req.body.email)) {
				errors.push(erro("E_INVALID_REQUEST", "Invalid email format"));
			}
		}
	}

	if (!req.body.hasOwnProperty("firstname")) {
		errors.push(erro("E_INVALID_REQUEST", "Firstname not supplied"));
	} else {
		var firstNameLen = req.body.firstname.length;
		if (firstNameLen < 2 || firstNameLen > 70) {
			errors.push(erro("E_INVALID_REQUEST", "Firstname length is invalid"));
		}
	}

	if (!req.body.hasOwnProperty("lastname")) {
		errors.push(erro("E_INVALID_REQUEST", "Lastname not supplied"));
	} else {
		var firstNameLen = req.body.lastname.length;
		if (firstNameLen < 2 || firstNameLen > 70) {
			errors.push(erro("E_INVALID_REQUEST", "Lastname length is invalid"));
		}
	}

	// Checking the password against the security policy
	if (!req.body.hasOwnProperty("password")) {
		errors.push(erro("E_INVALID_REQUEST", "Password not supplied"));
	} else {
		var passwordPolicyErrors = checkPasswordAgainstPolicy(req.body.password);

		for (var i=0;i<passwordPolicyErrors.length;i++) {
			errors.push(passwordPolicyErrors[i]);
		}
	}

	if (errors.length == 0) {
		// We check that the email address is not already in the database
		User.findOne({ email: req.body.email }, function (err, user){
		  if (user != null) {
			  // Email already registered
			  errors.push(erro("E_EMAIL_ALREADY_REGISTERED", "Email already registered"));
			  respondToUser(res, errors, null);
		  } else {
			// If the email is not in the database, an identifier is generated, which will uniquely identify our new user
			generateId(function(generatedId) {
				// A salt is generated as well. This is used to hash the user's password
				generateSalt(function(generatedSalt) {
					// Password is then hashed
					hashPassword(generatedSalt, req.body.password, function(encryptedPassword) {
						var newUser = new User({ _id: generatedId,
												 email: req.body.email,
												 salt: generatedSalt,
												 encrypted_password: encryptedPassword,
												 firstname: req.body.firstname,
												 lastname: req.body.lastname });

						// Our new user is then inserted in the database
						newUser.save(function (err, newUser) {
							if (err) {
								errors.push(erro("E_GENERIC_ERROR", "Cannot insert into database"));
								console.error(err);
							} else {
								console.log('User added ' + newUser);
							}

							respondToUser(res, errors, null);
						});
					});
				});
			});
		  }
		});
	} else {
		respondToUser(res, errors, null);
	}
});

/*
This function generates a random hex string made of 20 random bytes
Once generated, the provided callback is called and received the generated id as parameter
*/
function generateId(callback) {
	require('crypto').randomBytes(20, function(ex, buf) {
		var generatedId = buf.toString('hex');
		callback(generatedId);
	});
}

/*
This function generates a random hex salt made of 20 random bytes
Once generated, the provided callback is called and received the generated salt as parameter
*/
function generateSalt(callback) {
	require('crypto').randomBytes(20, function(ex, buf) {
		var generatedSalt = buf.toString('hex');
		callback(generatedSalt);
	});
}

/*
This function will hash the supplied password. It is salted before being hashed to improve resilience against
targeted and non targeted brute force attacks.

salt: String used to salt the password. Must be unique per user in order to be effective.
clearPassword: password to hash
callback: Once the password is hashed, the callback function is called and receives the encrypted password as parameter
*/
function hashPassword(salt, clearPassword, callback) {
	var hashPassword = crypto.createHash('sha256').update(clearPassword).digest('hex');
	var encryptedPassword = crypto.createHash('sha256').update(hashPassword + salt).digest('hex');
	callback(encryptedPassword);
}

/*
This function will check the provided session token

If it is deemed valid (not expired, genuine and not tampered with), the callbackIfTokenIsValid callback is executed ; the user id is passed as parameter
In case the token is deemed invalid, the callbackIfTokenIsInvalid callback is called (without parameter)
*/
function checkAndExtractFromSessionToken(token, callbackIfTokenIsValid, callbackIfTokenIsInvalid) {
	jwt.verify(token, sessionSecret, function(err, decoded) {
      if (err) {
        callbackIfTokenIsInvalid();
      } else {
        callbackIfTokenIsValid(decoded.userId);
      }
    });
}

/*
This function is used to respond to a client, as per the generic answer in the REST documentation

res: Client to respond to
errors: Array of error messages (as described in the documentation). If no error is present, must be an empty array.
data: Specific answer to pass to the user (when there is none, any value is accepted)
*/
function respondToUser(res, errors, data) {
	var responseObject =
	{
	  'status': errors.length == 0 ? "ok" : "ko",
	  'messages': errors,
	  'data': data
	};

	res.format({
		'application/json': function() {
		  res.send(responseObject);
		}
	});
}

/*
Check two string for equality. Constant time to prevent timing attacks.

Returns true if val1 (String) is equals to val2 (String)
Otherwise returns false
*/
function checkStringTimeConst(val1, val2) {
  return crypto.createHash('sha256').update(val1).digest('hex') == crypto.createHash('sha256').update(val2).digest('hex');
}

// Authenticate user
router.post('/account', function (req, res) {

	var errors = [];
	var dataToSendToClient = {};

	if (!req.body.hasOwnProperty("email")) {
		errors.push("Email not supplied");
	}

	if (!req.body.hasOwnProperty("password")) {
		errors.push("Password not supplied");
	}

	var respondCallback = function () { respondToUser(res, errors, dataToSendToClient); };

	if (errors.length == 0) {
		// The spcified user must exist
		User.findOne({ 'email': req.body.email }, '_id salt encrypted_password', function (err, userFound) {
			if (userFound == null) {
				errors.push(erro('E_INVALID_ACCOUNT', "User not found"));
			} else {
				// The submitted password is hashed using the salt of the specified user
				hashPassword(userFound.salt, req.body.password, function(encryptedPasswordComputed) {
					if (checkStringTimeConst(encryptedPasswordComputed, userFound.encrypted_password)) {

						// Generating a new token for the authenticated user
						var userSessionToken = jwt.sign({ userId: userFound._id }, sessionSecret, {
														   expiresIn: 3600
														});

						dataToSendToClient = { 'session': userSessionToken };

						//console.log('User authenticated: ' + req.body.email + " session: " + dataToSendToClient);
					} else {
						errors.push(erro('E_BAD_PASSWORD', "Incorrect password"));
					}
				});
			}

			respondCallback();
		});
	} else {
		respondCallback();
	}
});

// Edit password
router.put('/account/password', function (req, res) {

	var authorizationHeader = req.headers['authorization'];

	var errors = [];
	var respondCallback = function () { respondToUser(res, errors, null); };

	if (!req.body.hasOwnProperty("password")) {
		errors.push("Password not supplied");
		respondCallback();
	} else {
		checkAndExtractFromSessionToken(authorizationHeader,
										function(userId) {

											// The submitted password is checked against the password policy
											var passwordPolicyErrors = checkPasswordAgainstPolicy(req.body.password);

											for (var i=0;i<passwordPolicyErrors.length;i++) {
												errors.push(passwordPolicyErrors[i]);
											}

											if (errors.length == 0) {
												console.log('Updating password for user ' + userId);

												// The user's salt is regenerated, for added safety
												generateSalt(function(generatedSalt) {
													hashPassword(generatedSalt, req.body.password, function(encryptedPassword) {

														// The user is updated in the database
														User.findOneAndUpdate({ '_id': userId }, { 'salt': generatedSalt, 'encrypted_password': encryptedPassword }, function (err, person) {
															if (err) {
																errors.push(erro('E_GENERIC_ERROR', "Cannot update database"));
															} else {
																console.log('Password updated');
															}

															respondCallback();
														});
													});
												});
											} else {
												respondCallback();
											}
										},
										function() {
											errors.push(erro('E_INVALID_SESSION', 'Invalid or no session provided'));
											respondCallback();
										});
	}
});
