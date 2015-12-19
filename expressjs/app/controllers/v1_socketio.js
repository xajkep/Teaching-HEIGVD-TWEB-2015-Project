/*
This file contains all socket.io APIs
*/

var appjs = require(__dirname + '/../../app.js');
var sio = appjs.sio;
var globals = require(__dirname + '/../inmemory/globals.js');
var common = require(__dirname + '/../common/common.js');
var mongoose = require('mongoose');

// Mongoose schemas
var User = mongoose.model('User');
var Poll = mongoose.model('Poll');

module.exports = function (app) {
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
				socket.voted = currentQuestion.voted;
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
						voted = socket.voted > 0;
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
		common.checkAndExtractFromSessionToken(authData.session,
										function(userId) {
											
											var joinPollResult = globals.userJoinPoll(authData.poll, userId);
		
											if (joinPollResult === false) {
												console.log('ERROR: cannot join poll');
												var errors = [];
												errors.push(common.erro('E_INVALID_IDENTIFIER', 'The specified poll does not exist or is not opened'));
												socket.emit('authAndJoinResult', {'status': 'ko', 'messages': errors});
											} else {
												console.log('Socket.io authentication success');

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
														socket.voted = 0;
														
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
											errors.push(common.erro('E_UNAUTHORIZED', 'You are either not authenticated or not a speaker'));
											socket.emit('authAndJoinResult', {'status': 'ko', 'messages': errors});
										});
	});

	// A speaker wants to display the next question in the poll
	socket.on('goNextQuestion', function() {
		console.log('Processing goNextQuestion');

		if (socket.isAuthenticated === true && socket.isSpeaker === true) {
			for (var socketId in sio.nsps['/'].adapter.rooms['poll_' + socket.pollId + '_audience']){
				sio.sockets.connected[socketId].voted = 0;
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
			errors.push(common.erro('E_UNAUTHORIZED', 'You are either not authenticated or not a speaker'));
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
			globals.vote(socket.pollId, answerIndex, socket.userId, socket.voted, voteAsAnonymous,
						function(timing, voteRegisteredAsAnonymous) {
							// Vote registered
							console.log('Vote registered');
							socket.voted = socket.voted + 1;
							socket.emit('voteResult', {'status': 'ok'});
							
							// Retrieving live voting results to send to speakers
							var liveResults = globals.getLiveResults(socket.pollId);
							
							// Hiding the user id if the vote was registered as anonymous
							var whoVoted = voteRegisteredAsAnonymous ? null : socket.userId;
							
							sio.to('poll_' + socket.pollId + '_speaker').emit('liveVoteResults', { 'results': liveResults, 'whovoted': whoVoted, 'timing': timing });
						}, function() {
							// An error occured during the vote registration
							var errors = [];
							errors.push(common.erro('E_GENERIC_ERROR', 'A generic error occured'));
							socket.emit('voteResult', {'status': 'ko', 'messages': errors});
						});
		} else {
			var errors = [];
			errors.push(common.erro('E_UNAUTHORIZED', 'You are not authenticated'));
			socket.emit('voteResult', {'status': 'ko', 'messages': errors});
		}
	});
});
