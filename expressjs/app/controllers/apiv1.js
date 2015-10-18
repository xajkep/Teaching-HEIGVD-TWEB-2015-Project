// HMAC secret used to secure pseudo-sessions against tampering
var sessionSecret = 'VlL_LGgy5yu89-nW+7U6f7u0TbIlmP.z';
var socketIOPort = 8090;

var express = require('express');
var crypto = require('crypto');
var router = express.Router();
var mongoose = require('mongoose');
var url = require('url');
var jwt = require('jsonwebtoken');
var globals = require(__dirname + '/../inmemory/globals.js'); // Our globals.js file
var sio = require('socket.io').listen(socketIOPort);

// Mongoose schemas
var User = mongoose.model('User');
var Poll = mongoose.model('Poll');

module.exports = function (app) {
  app.use('/api/v1', router);
};

sio.sockets.on('connection', function (socket) {
	socket.isAuthenticated = false;
	console.log('New socket.io connection');
	
	socket.on('authAndJoin', function(authData) {
		console.log('Processing authAndJoin');
		checkAndExtractFromSessionToken(authData.session,
										function(userId) {
											var joinPollResult = globals.userJoinPoll(authData.poll, userId);
		
											if (joinPollResult === false) {
												console.log('ERROR: cannot join poll');
												socket.emit('authAndJoinResult', {'status': 'ko', 'messages': ['Cannot join poll']});
											} else {
												console.log('Socket.io authentication success');
												
												socket.isAuthenticated = true;
												socket.userId = userId;
												socket.pollId = authData.poll;
												socket.isSpeaker = (joinPollResult == 'speaker');
												
												// Poll room
												socket.join('poll_' + authData.poll);
												socket.join('poll_' + authData.poll + '_' + joinPollResult);
												
												// joinPollResult = 'speaker|audience'
												socket.emit('authAndJoinResult', {'status': 'ok', 'data': joinPollResult});
												
												// Speaker is notified when a new user connects
												if (joinPollResult == 'audience'){
													sio.to('poll_' + authData.poll + '_speaker').emit('userConnect',
																									  { '_id': 'lolololol', 'firstName': 'Luc', 'lastName': 'Smith' });
												}
											}
										},
										function() {
											console.log('Socket.io authentication failure');
											socket.emit('authAndJoinResult', {'status': 'ko', 'messages': ['Invalid session or no session provided']});
										});
	});

	socket.on('goNextQuestion', function() {
		console.log('Processing goNextQuestion');

		if (socket.isAuthenticated === true && socket.isSpeaker === true) {
			globals.goNextQuestion(socket.pollId,
			                       function(nextQuestion) {
									   // Next question (timer is running)
									   sio.to('poll_' + socket.pollId).emit('nextQuestion', nextQuestion);
									   console.log('Notified clients: next question data');
								   },
								   function() {
									   // Poll completed
									   sio.to('poll_' + socket.pollId).emit('pollCompleted');
									   console.log('Notified clients: poll completed');
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
			socket.emit('goNextQuestionResult', {'status': 'ko', 'messages': ['Unauthorized']});
		}
	});
	
	socket.on('vote', function(answerIndex) {
		console.log('Processing vote');

		if (socket.isAuthenticated === true && socket.isSpeaker !== true) {
			if (globals.vote(socket.pollId, answerIndex, socket.userId)) {
				console.log('Vote registered');
				socket.emit('voteResult', {'status': 'ok'});
				
				var liveResults = globals.getLiveResults(socket.pollId);
				console.log('Live vote results: ' + liveResults);
				
				sio.to('poll_' + socket.pollId + '_speaker').emit('liveVoteResults', liveResults);
				
			} else {
				socket.emit('voteResult', {'status': 'ko', 'messages': ['Invalid data or request']});
			}
		} else {
			socket.emit('voteResult', {'status': 'ko', 'messages': ['Unauthorized']});
		}
	});
});

// Open a poll
router.post('/poll/:id', function (req, res) {
	var pollIdToOpen = req.params.id;
	var authorizationHeader = req.headers['authorization'];
	console.log('Authorization header provided: ' + authorizationHeader);
	
	var errors = [];
	var dataRespondToClient = {};
	var respondCallback = function () { respondToUser(res, errors, dataRespondToClient); };

	checkAndExtractFromSessionToken(authorizationHeader,
									function(userId) {
										Poll.findOne({ '_id': pollIdToOpen }, function (err, poll) {
										  if (err) {
											  errors.push('Invalid poll id provided');
										  } else {
											 if (checkStringTimeConst(poll.created_by, userId)) {
												if (poll.state == 'pending') {
													
													if (!globals.loadPollInMemory(poll)) {
														errors.push('Cannot load poll in memory');
													}

												} else {
													errors.push('Poll cannot be opened');
												}
											 } else {
												 errors.push('You did not create this poll');
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

// View my polls
router.get('/polls', function (req, res) {
	var authorizationHeader = req.headers['authorization'];
	console.log('Authorization header provided: ' + authorizationHeader);
	
	var errors = [];
	var dataRespondToClient = {};
	var respondCallback = function () { respondToUser(res, errors, dataRespondToClient); };
	
	checkAndExtractFromSessionToken(authorizationHeader,
									function(userId) {
										Poll.find({ created_by: userId }, '_id state creation_date name', function (err, userPolls){
											dataRespondToClient = userPolls;
											respondCallback();
										});
									},
									function() {
										errors.push('Invalid or no session provided');
										respondCallback();
									});
});

// Search users by email
router.get('/users/email/:id', function (req, res) {
	var emailToSearch = req.params.id;
	var authorizationHeader = req.headers['authorization'];
	console.log('Authorization header provided: ' + authorizationHeader);
	
	var errors = [];
	var dataRespondToClient = [];
	var respondCallback = function () { respondToUser(res, errors, dataRespondToClient); };
	
	checkAndExtractFromSessionToken(authorizationHeader,
									function(userId) {
										if (emailToSearch.length >= 3) {
											// email LIKE 'emailToSearch%'
											User.find({ email: new RegExp('^' + emailToSearch, 'i') }).select('_id email').limit(5).exec(function (err, users) {
												
												var retrieved = 0;
												var usersCount = users.length;
												var currentUsers = {};
												for (var i=0; i < usersCount; i++) {
													currentUsers[users[i]._id] = {
														'email': users[i].email,
														'polls': []
													};

													Poll.find({ 'created_by': users[i]._id }).select('_id created_by name creation_date').exec(function (err, polls) {
														
														if (polls.length > 0) {
															currentUsers[polls[0].created_by].polls = polls;
														}
														
														if (++retrieved == users.length) {
															
															for (var k in currentUsers) {
																dataRespondToClient.push(currentUsers[k]);
															}
															
															
															console.log(dataRespondToClient);
															respondCallback();
														}
													});
												}
											});
										} else {
											errors.push('Email is too short');
											respondCallback();
										}
									},
									function() {
										errors.push('Invalid or no session provided');
										respondCallback();
									});
});

// Get a poll
router.get('/poll/:id', function (req, res) {
	var pollIdToRetrieve = req.params.id;
	var authorizationHeader = req.headers['authorization'];
	console.log('Authorization header provided: ' + authorizationHeader);
	
	var errors = [];
	var dataRespondToClient = {};
	var respondCallback = function () { respondToUser(res, errors, dataRespondToClient); };
	
	checkAndExtractFromSessionToken(authorizationHeader,
									function(userId) {
										// populate() will resolve "foreign keys"
										Poll.findOne({ _id: pollIdToRetrieve }).populate('questions.answers.users').exec(function (err, poll){
										  if (err) {
											  errors.push('Invalid poll id provided');
										  } else {
											 if (checkStringTimeConst(poll.created_by, userId)) {
												dataRespondToClient = poll;
											 } else {
												 errors.push('You did not create this poll');
											 }
											 
											 respondCallback();
										  }
										});
									},
									function() {
										errors.push('Invalid or no session provided');
										respondCallback();
									});
});


// Delete a poll
router.delete('/poll/:id', function (req, res) {
	
	// TO-DO: check if poll is opened. In that case no deletion is possible
	// TO-DO: delete poll in memory, if necessary
	
	var pollIdToDelete = req.params.id;
	
	var authorizationHeader = req.headers['authorization'];
	console.log('Authorization header provided: ' + authorizationHeader);
	
	var errors = [];
	var newPollDTO = {};
	var respondCallback = function () { respondToUser(res, errors, {}); };
	
	checkAndExtractFromSessionToken(authorizationHeader,
									function(userId) {
										Poll.findOne({ _id: pollIdToDelete }, 'created_by', function (err, poll){
										  if (poll == null) {
											  errors.push('Invalid poll id provided');
											  respondCallback();
										  } else {
											 if (checkStringTimeConst(poll.created_by, userId)) {
												Poll.remove({ _id: pollIdToDelete }, function(err) {
													if (err) {
														errors.push('Cannot delete poll');
													}
													else {
														// TO-DO
													}
													
													respondCallback();
												});
											 } else {
												 errors.push('You did not create this poll');
												 respondCallback();
											 }
										  }
										});
									},
									function() {
										errors.push('Invalid or no session provided');
										respondCallback();
									});
});


// Create new poll
router.put('/poll', function (req, res) {
	
	// TO-DO: check duplicate name
	
	var authorizationHeader = req.headers['authorization'];
	console.log('Authorization header provided: ' + authorizationHeader);
	
	var errors = [];
	var newPollDTO = {};
	var respondCallback = function () { respondToUser(res, errors, {}); };
	
	checkAndExtractFromSessionToken(authorizationHeader,
									function(userId) {
										
										if (!req.body.hasOwnProperty("name")) {
											errors.push("Poll name not supplied");
										}

										if (!req.body.hasOwnProperty("questions")) {
											errors.push("Poll questions not supplied");
										} else {
											
											var pollName = req.body.name;
										
											newPollDTO.name = pollName;
											newPollDTO.questions = [];
											
											if (req.body.questions.length < 1) {
												errors.push("At least one question must be specified");
											}
											
											for (var questionIndex = 0; questionIndex < req.body.questions.length ; questionIndex++) {
												var currentQuestionDTO = {};
												var currentQuestion = req.body.questions[questionIndex];
												
												if (!currentQuestion.hasOwnProperty("name")) {
													errors.push("Question has no name");
													break;
												}

												if (!currentQuestion.hasOwnProperty("allowAnonymous")) {
													errors.push("Question has no allowAnonymous");
													break;
												}
												
												if (!currentQuestion.hasOwnProperty("maxVote")) {
													errors.push("Question has no maxVote");
													break;
												}
												
												if (!currentQuestion.hasOwnProperty("answers")) {
													errors.push("Question has no answers");
													break;
												}
												
												var currentQuestionName = currentQuestion.name;
												var currentQuestionAllowAnonymous = currentQuestion.allowAnonymous;
												var currentQuestionMaxVotes = currentQuestion.maxVote;
												var currentQuestionAnswers = currentQuestion.answers;
												
												currentQuestionDTO.name = currentQuestionName;
												currentQuestionDTO.allowAnonymous = currentQuestionAllowAnonymous;
												currentQuestionDTO.maxVote = currentQuestionMaxVotes;
												currentQuestionDTO.answers = [];

												console.log("Question: " + currentQuestionName);
												
												if (currentQuestionAnswers.length < 2) {
													errors.push("At least two answers must be specified");
												}
												
												for (var answerIndex = 0; answerIndex < currentQuestionAnswers.length ; answerIndex++) {
													var currentAnswerDTO = {};
													var currentAnswer = currentQuestionAnswers[answerIndex];
													
													if (!currentQuestion.hasOwnProperty("name")) {
														errors.push("Answer has no name");
														break;
													}
													
													var currentAnswerName = currentAnswer.name;
													currentAnswerDTO.name = currentAnswerName;
													
													console.log("  Answer: " + currentAnswerName);
													
													currentQuestionDTO.answers.push(currentAnswerDTO);
												}
												
												newPollDTO.questions.push(currentQuestionDTO);
												
												if (errors.length > 0) {
													break;
												}
											}
											
											//console.log("newPollDTO: %j", newPollDTO);
										}
										
										if (errors.length == 0) {
											generateId(function(generatedPollId) {
												console.log('Adding new poll');
												
												var newPoll = new Poll({ _id: generatedPollId,
																		 state: 'pending',
																		 created_by: userId,
																		 creation_date: new Date(),
																		 name: newPollDTO.name });
																		 
												newPoll.questions = [];

												for (var indexQuestion = 0 ; indexQuestion < newPollDTO.questions.length; indexQuestion++) {
													var currentQuestion = newPollDTO.questions[indexQuestion];
													var currentQuestionToAdd = { _id: generatedPollId + '-' + indexQuestion,
																				 name: currentQuestion.name,
																				 maxVote: currentQuestion.maxVote,
																				 allowAnonymous: currentQuestion.allowAnonymous,
																				 answers: []
																				};
													
													for (var indexAnswer = 0 ; indexAnswer < currentQuestion.answers.length; indexAnswer++) {
														var currentAnswer = currentQuestion.answers[indexAnswer];
														currentQuestionToAdd.answers.push({_id: generatedPollId + '-' + indexQuestion + '-' + indexAnswer,
																						   name: currentAnswer.name,
																						   users: []});
													}
													
													newPoll.questions.push(currentQuestionToAdd);
												}
																			   
												newPoll.save(function (err, newPoll) {
													if (err) {
														errors.push('Cannot add poll');
													} else {
														console.log('Poll added');
													}
													
													respondCallback();
												});
											});
										} else {
											respondCallback();
										}
									},
									function() {
										errors.push('Invalid or no session provided');
										respondCallback();
									});

	
});


// New user account
router.put('/register', function (req, res) {
	var errors = [];

	if (!req.body.hasOwnProperty("email")) {
		errors.push("Email not supplied");
	}
	
	if (!req.body.hasOwnProperty("firstname")) {
		errors.push("Firstname not supplied");
	}
	
	if (!req.body.hasOwnProperty("lastname")) {
		errors.push("Lastname not supplied");
	}
	
	if (!req.body.hasOwnProperty("password")) {
		errors.push("Password not supplied");
	}
	
	if (errors.length == 0) {
		User.findOne({ email: req.body.email }, function (err, user){
		  if (user != null) {
			  // Email already registered
			  errors.push("Email already registered");
			  respondToUser(res, errors, null);
		  } else {
			generateId(function(generatedId) {
				generateSalt(function(generatedSalt) {
					hashPassword(generatedSalt, req.body.password, function(encryptedPassword) {
						console.log("Inserting user: " + generatedId);
						console.log("Salt: " + generatedSalt);
						console.log("Encrypted password: " + encryptedPassword);
					
						var newUser = new User({ _id: generatedId,
												 email: req.body.email,
												 salt: generatedSalt,
												 encrypted_password: encryptedPassword,
												 firstname: req.body.firstname,
												 lastname: req.body.lastname });
												   
						newUser.save(function (err, newUser) {
							if (err) {
								errors.push("Cannot insert into database");
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

function generateId(callback) {
	require('crypto').randomBytes(20, function(ex, buf) {
		var generatedId = buf.toString('hex');
		callback(generatedId);
	}); 
}

function generateSalt(callback) {
	require('crypto').randomBytes(20, function(ex, buf) {
		var generatedSalt = buf.toString('hex');
		callback(generatedSalt);
	}); 
}

function hashPassword(salt, clearPassword, callback) {
	var hashPassword = crypto.createHash('sha256').update(clearPassword).digest('hex');
	var encryptedPassword = crypto.createHash('sha256').update(hashPassword + salt).digest('hex');
	callback(encryptedPassword);
}

function checkAndExtractFromSessionToken(token, callbackIfTokenIsValid, callbackIfTokenIsInvalid) {
	jwt.verify(token, sessionSecret, function(err, decoded) {
      if (err) {
		console.log('Session is invalid');
        callbackIfTokenIsInvalid();
      } else {
		console.log('Session is valid. Retrieved from token: userId=' + decoded.userId);
        callbackIfTokenIsValid(decoded.userId);
      }
    });
}

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
*/
function checkStringTimeConst(val1, val2) {
  return crypto.createHash('sha256').update(val1).digest('hex') == crypto.createHash('sha256').update(val2).digest('hex');
}

// Authenticate user
router.post('/account', function (req, res) {

	var errors = [];
	var dataToSendToClient = {}

	if (!req.body.hasOwnProperty("email")) {
		errors.push("Email not supplied");
	}
	
	if (!req.body.hasOwnProperty("password")) {
		errors.push("Password not supplied");
	}
	
	var respondCallback = function () { respondToUser(res, errors, dataToSendToClient); };

	if (errors.length == 0) {
		User.findOne({ 'email': req.body.email }, '_id salt encrypted_password', function (err, userFound) {
			if (userFound == null) {
				errors.push("User not found");
			} else {
				hashPassword(userFound.salt, req.body.password, function(encryptedPasswordComputed) {
					if (checkStringTimeConst(encryptedPasswordComputed, userFound.encrypted_password)) {
						// User provided correct password
						//req.session.cookie.userId = userFound._id;
						//res.header('Authorization', req.sessionID);
						console.log('User authenticated ' + req.body.email);
						
						var userSessionToken = jwt.sign({ userId: userFound._id }, sessionSecret, {
														   expiresIn: 3600
														});
						
						dataToSendToClient = { 'session': userSessionToken };
						
						console.log('User authenticated: ' + req.body.email + " session: " + dataToSendToClient);
					} else {
						errors.push("Incorrect password");
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
router.post('/account/password', function (req, res) {
	
	var errors = [];
	
	if (!req.body.hasOwnProperty("password")) {
		errors.push("Password not supplied");
	}
	
	var respondCallback = function () { respondToUser(res, errors, null); };
	
	
	var pollIdToDelete = req.params.id;
	
	var authorizationHeader = req.headers['authorization'];
	console.log('Authorization header provided: ' + authorizationHeader);
	
	var errors = [];
	var newPollDTO = {};
	var respondCallback = function () { respondToUser(res, errors, {}); };
	
	checkAndExtractFromSessionToken(authorizationHeader,
									function(userId) {
										if (errors.length == 0) {
											console.log('Updating password for user ' + userId);
											
											generateSalt(function(generatedSalt) {
												hashPassword(generatedSalt, req.body.password, function(encryptedPassword) {
													
													console.log('New salt ' + generatedSalt);
													console.log('New encrypted password ' + encryptedPassword);
													
													User.findOneAndUpdate({ '_id': userId }, { 'salt': generatedSalt, 'encrypted_password': encryptedPassword }, function (err, person) {
														if (err) {
															errors.push("Cannot update database");
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
										errors.push('Invalid or no session provided');
										respondCallback();
									});
	
	
	
});

router.post('/', function(req, res) {
});
