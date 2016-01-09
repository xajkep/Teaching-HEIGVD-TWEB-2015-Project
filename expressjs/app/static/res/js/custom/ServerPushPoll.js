/*
This factory is used to implement asynchronous communication with the server while
the client is participating in a poll. It handles message sending and reception,
controllers can 
*/
tweb.factory('ServerPushPoll', function (DisplayErrorMessagesFromAPI) {
	
	// Socket.io instance
	var _sio = null;
	var _connectedUsers = [];
	
	// Callbacks
	var _cbOnUserConnect = null;
	var _cbOnUserDisconnect = null;
	var _cbOnAudienceList = null;
	var _cbOnPollDetails = null;
	var _cbOnNextQuestion = null;
	var _cbOnPollCompleted = null;
	var _cbOnVotingOnThisQuestionEnded = null;
	var _cbOnVoteResult = null;
	var _cbOnLiveVoteResults = null;
	var _cbOnDuplicateConnection = null;
	
	// Sends the catchUp message to the server
	var _catchUp = function() {
		_sio.emit('catchUp');
	}
	
	// Registers a callback that will be executed when the liveVoteResults message is received
	var _registerLiveVoteResults = function(cbOnLiveVoteResults) {
		_cbOnLiveVoteResults = cbOnLiveVoteResults
	}
	
	// Registers the multiple basic callbacks useful for both the speaker and the audience
	var _registerBasicPollEvents = function(cbOnDuplicateConnection, cbOnPollDetails, cbOnNextQuestion, cbOnPollCompleted, cbOnVotingOnThisQuestionEnded, cbOnVoteResult) {
		_cbOnDuplicateConnection = cbOnDuplicateConnection;
		_cbOnPollDetails = cbOnPollDetails;
		_cbOnNextQuestion = cbOnNextQuestion;
		_cbOnPollCompleted = cbOnPollCompleted;
		_cbOnVotingOnThisQuestionEnded = cbOnVotingOnThisQuestionEnded;
		_cbOnVoteResult = cbOnVoteResult;
	};
	
	// Registers multiple callbacks useful only for the speaker
	var _registerEventsWhenPeopleConnectAndDisconnect = function(cbOnUserConnect, cbOnUserDisconnect, cbOnAudienceList) {
		_cbOnUserConnect = cbOnUserConnect;
		_cbOnUserDisconnect = cbOnUserDisconnect;
		_cbOnAudienceList = cbOnAudienceList;
	};
	
	// Sends a goNextQuestion message to the server (speaker only)
	var _goNextQuestion = function() {
		_sio.emit('goNextQuestion');
	};
	
	// Sends a vote to the server (audience only)
	// answerIndex: index of the answer to cast a vote for (in the current active question)
	// voteAsAnonymous: true to cast as anonymous, false otherwise. This parameter has no meaning when the current active question does not support anonymous voting (specify any value)
	var _vote = function(answerIndex, voteAsAnonymous) {
		_sio.emit('vote', { 'answerIndex': answerIndex, 'voteAsAnonymous': voteAsAnonymous});
	};
	
	// Disconnect the socket.io client
	var _disconnect = function() {
		_sio.disconnect();
	};

	// Establish a new connection to the server
	// host: host to connect to
	// port: port to connect to
	// Specifying null for either the host or the port will connect to the same server and port as the server who served this page
	// pollIdToJoin: id of the poll to join
	// The server will then decide if you join as speaker (if you are the poll owner) or as audience (if not).
	//   cbJoinedAsSpeaker is executed when the server chose to make you join as speaker
	//   cbJoinedAsAudience is executed when the server chose to make you join as audience
	// Of course, only one of these callbacks is executed for each call to this function
	var _connect = function(host, port, session, pollIdToJoin, cbJoinedAsSpeaker, cbJoinedAsAudience) {
		
		_connectedUsers = [];
		
		if (host == null || port == null) {
			_sio = io.connect({ 'force new connection': true }); // same host
		} else {
			_sio = io.connect(host + ':' + port, { 'force new connection': true });
		}

		_sio.on('authAndJoinResult', function(authAndJoinResult) {
			if (authAndJoinResult.status == 'ok') {
				if (authAndJoinResult.data == 'speaker') {
					cbJoinedAsSpeaker();
				} else {
					cbJoinedAsAudience();
				}
			} else {
				Lobibox.alert(
					'error',
					{
						"msg": 'Join poll failure: ' + DisplayErrorMessagesFromAPI(authAndJoinResult.messages, "<br />")
					}
				);
			}
		});
		
		// When a new audience member joins the poll
		_sio.on('userConnect', function(user) {
			_connectedUsers.push(user);
			if (_cbOnUserConnect != null) {
				_cbOnUserConnect(_connectedUsers);
			}
		});
		
		// When a previously joined audience member quits
		_sio.on('userDisconnect', function(userId) {
			var newList = [];
			var usersCount = _connectedUsers.length;
			for (var i=0; i < usersCount; i++) {
				if (_connectedUsers[i]._id != userId) {
					newList.push(_connectedUsers[i]);
				}
			}

			_connectedUsers = newList;

			if (_cbOnUserDisconnect != null) {
				_cbOnUserDisconnect(_connectedUsers);
			}
		});
		
		// When the server responds to a catchUp message with the list of the audience members (speaker only)
		_sio.on('audienceList', function(audienceList) {

			_connectedUsers = audienceList;

			if (_cbOnAudienceList != null) {
				_cbOnAudienceList(_connectedUsers);
			}
		});

		// When the server sends the next question
		_sio.on('nextQuestion', function(nextQuestion) {
			
			// null will make the view display an unknown sign next to the user for the "has voted" attribute
			var assign = nextQuestion.allowAnonymous ? null : false;
			
			var usersCount = _connectedUsers.length;
			for (var i=0; i < usersCount; i++) {
				_connectedUsers[i].voted = assign;
			}
			
			if (_cbOnNextQuestion != null) {
				_cbOnNextQuestion(nextQuestion);
			}
		});
		
		// When the poll is done
		_sio.on('pollCompleted', function() {
			if (_cbOnPollCompleted != null) {
				_cbOnPollCompleted();
			}
		});
		
		// When the question timeout reached zero
		_sio.on('votingOnThisQuestionEnded', function() {
			if (_cbOnVotingOnThisQuestionEnded != null) {
				_cbOnVotingOnThisQuestionEnded();
			}
		});
		
		// When the server responds to a catchUp message with the current question results (speaker only)
		_sio.on('voteResult', function(result) {
			if (_cbOnVoteResult != null) {
				_cbOnVoteResult(result);
			}
		});
		
		// When someone casted a vote (speaker only)
		_sio.on('liveVoteResults', function(results) {

			// null if catching up or anonymous vote
			if (results.whovoted != null) {
				var usersCount = _connectedUsers.length;
				for (var i=0; i < usersCount; i++) {
					if (_connectedUsers[i]._id == results.whovoted) {
						_connectedUsers[i].voted = true;
					}
				}
			}
			
			if (_cbOnLiveVoteResults != null) {
				_cbOnLiveVoteResults(results);
			}
		});
		
		// When the server responds to the catchUp message with the details of the poll
		_sio.on('pollDetails', function(results) {
			if (_cbOnPollDetails != null) {
				_cbOnPollDetails(results);
			}
		});
		
		// When the same user joins the poll while it already has a session opened for the same poll (audience only)
		_sio.on('duplicateConnection', function(results) {
			if (_cbOnDuplicateConnection != null) {
				_cbOnDuplicateConnection();
			}
		});

		// Once connected, the authAndJoin message is immediately sent to the server
		_sio.on('connect', function() {
			_sio.emit('authAndJoin', { 'session': session, 'poll': pollIdToJoin });
		});
	};

	return {
		connect: _connect,
		registerEventsWhenPeopleConnectAndDisconnect: _registerEventsWhenPeopleConnectAndDisconnect,
		connectedUsers: _connectedUsers,
		registerBasicPollEvents: _registerBasicPollEvents,
		goNextQuestion: _goNextQuestion,
		vote: _vote,
		registerLiveVoteResults: _registerLiveVoteResults,
		catchUp: _catchUp,
		disconnect: _disconnect
	}
});