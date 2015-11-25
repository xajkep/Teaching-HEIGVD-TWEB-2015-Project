/*
This file contains all functions related to the lifecycle of a poll (from opening to closing)
*/
var HashMap = require('hashmap');
var polls = new HashMap();
var pollHardTimeout = 3600 * 6; // in seconds

var mongoose = require('mongoose');
var Poll = mongoose.model('Poll');

/*
Returns the number of times (>=0) the specified user already casted a vote on the current question in the specified poll

Parameters:
poll: Object describing the poll
userId: Id of the user
*/
var countAlreadyVoted = function(poll, userId) {
	var alreadyVotedCount = 0;
	
	var question = poll.questions[poll.currentQuestion];
	var answersCount = question.answers.length;
	
	for (var answerIndex = 0; answerIndex < answersCount; ++answerIndex) {
		var answer = question.answers[answerIndex];
		var usersLength = answer.users.length;
		
		for (var i = 0; i < usersLength; ++i) {
			if (answer.users[i].user == userId) {
				alreadyVotedCount = alreadyVotedCount + 1;
			}
		}
	}
	
	return alreadyVotedCount;
};

/*
This function closes a specific poll.
Closing is done when:
- The poll just finished (each answer has been displayed on screen) or
- The hard timeout just kicked in. This means the poll was opened for too long.

Closing a poll means:
- Unloading it from memory
- Updating the database to mark it as completed (when each answer has been displayed on screen) or
closed (when the hard timeout kicked in). This is a parameter.

Parameters:
poll: Object describing the poll
pollCompleted: true if hard timeout did NOT kick it
cbWhenPollIsClosed: callback executed when the poll is closed. The poll's id is received as parameter
*/
var unloadPoll = function(poll, pollCompleted, cbWhenPollIsClosed) {
	clearTimeout(poll.timeoutHardUnloadHdl);
	poll.timeoutHardUnloadHdl = null;
	
	polls.remove(poll._id);

	var updateAs = pollCompleted ? 'completed' : 'closed';
	
	Poll.update({'_id': poll._id }, {'state': updateAs}, function(err, numAffected) {
		cbWhenPollIsClosed(poll.id);
	});
}

module.exports = {

	/*
	This function loads a poll in memory so it can be used for live voting.
	The field status of the specified poll is updated in the database to: opened
	
	Parameters:
	poll: Object describing the poll
	cbWhenPollIsClosed: Callback executed when the poll is closed (either manually or automatically). The poll's id is received as parameter
	*/
	loadPollInMemory: function(poll, cbWhenPollIsClosed) {
		console.log('Loading poll in memory: ' + poll._id);
		
		if (polls.has(poll._id)) {
			return false;
		}

		poll.cancelTimeout = null;
		poll.currentQuestion = -1;
		poll.voteAllowed = false;
		
		polls.set(poll._id, poll);
		console.log('Poll added in memory');
		
		Poll.update({'_id': poll._id }, {'state': 'opened'}, function(err, numAffected) {
		});
		
		poll.timeoutHardUnloadHdl = setTimeout(function() {
				       unloadPoll(poll, false, cbWhenPollIsClosed);
				  }, pollHardTimeout * 1000);
		
		return true;
	},
	
	/*
	This function registers a new vote for the active question in the specified poll
	
	Parameters:
	pollId: Id of the poll
	userId: If of the user who cast a vote
	answerIndex: Index of the answer to vote for (0 for the first answer, n-1 for the last answer)
	voteAsAnonymous: true to cast this vote as anonymous, false otherwise (has no effect if the active question does not allow anonymous voting)
	cbWhenOK: callback executed when the vote has been successfully registered. The amount of time (in ms) since the question was opened and the vote casted is received as first parameter. The second parameter indicates if the vote was registered as anonymous (true) or not (false)
	cbWhenKO: callback executed when the vote cannot be casted (invalid pollId specified, poll not in memory, voting no more allowed in the poll, the user already casted too many votes, invalid answerIndex specified)
	*/
	vote: function(pollId, answerIndex, userId, voteAsAnonymous, cbWhenOK, cbWhenKO) {
		if (!polls.has(pollId)) {
			cbWhenKO();
			return;
		}
		
		var poll = polls.get(pollId);
		
		if (poll.voteAllowed !== true) {
			cbWhenKO();
			return;
		}
		
		var question = poll.questions[poll.currentQuestion];
		var answersCount = question.answers.length;
		
		// Checking the index. It must correspond to an existing answer for the current question.
		if (answerIndex < 0 || answerIndex >= answersCount) {
			cbWhenKO();
			return;
		}
		
		// We then make sure the user cannot cast more votes than they are allowed to.
		var alreadyVotedCount = countAlreadyVoted(poll, userId);
		
		if (alreadyVotedCount >= poll.maxVote) {
			cbWhenKO();
			return;
		}

		var answer = question.answers[answerIndex];
		var voteAsAnonymousRegister = question.allowAnonymous ? voteAsAnonymous : false;

		// Computing the delta T (in milliseconds)
		var currentTime = new Date();
		var deltaT = currentTime - question.started;
		
		
		answer.users.push({ 'user': userId, 'anonymous': voteAsAnonymousRegister, 'timing': deltaT });
		console.log('deltaT=' + deltaT);
		
		cbWhenOK(deltaT, voteAsAnonymousRegister);
	},
	
	/*
	This function returns "live voting results" for the active question in the specified poll
	
	Parameters:
	pollId: Id of the poll
	
	Returns false in case of error (invalid pollId specified, poll not in memory, voting not started in the poll)
	        an array of objects otherwise.
			
			Example:
			
			If the first answer of the active question in the supplied poll id has 32 votes, the second 3 votes and the third 6 votes, the array will be:
			
			[ {
				'count': 32,
			  },
			  {
				'count': 3,
			  },
			  {
				'count': 6,
			  }
			]
	*/
	getLiveResults: function(pollId) {
		if (!polls.has(pollId)) {
			return false;
		}

		var poll = polls.get(pollId);
		
		// If the poll has not started yet
		if (poll.currentQuestion < 0) {
			return false;
		}
		
		var response = [];
		var currentQuestion = poll.questions[poll.currentQuestion];
		
		var answersCount = currentQuestion.answers.length;
		for (var i=0;i<answersCount;++i) {
			var currentAnswer = currentQuestion.answers[i];
			response.push({
				'count': currentAnswer.users.length
			});
		}
		
		return response;
	},

	/*
	This function will return the active question in the specified poll. It will decorate it with specific user data.
	
	Parameters:
	pollId: Id of the poll
	userId: If of the user requesting the data
	
	Returns false in case of error (invalid pollId specified, poll not in memory, voting not started in the poll)
	        object (otherwise) describing the current question and what the user can do
			
			Example:
			
			Let's admin the active question timeout is set to 15 seconds.
			The specified user just joined the poll. Of course, he has less time to vote.
			
			'question': Current question in natural language
			'voted': Number of times the specified user already voted on the active question
			'timeout': Amount of time in seconds the user can vote until the timeout for this question ends
			'current': Current question in the poll (starts at 1 for the first question)
			'total': Number of questions in the poll
			
			{
				'question': 'How is the weather today?',
				'voted': 3,
				'timeout': 6,
				'current': 2,
				'total': 5
			}
	*/
	getCurrentQuestion: function(pollId, userId) {
		if (!polls.has(pollId)) {
			return false;
		}
		
		var poll = polls.get(pollId);
		
		if (poll.currentQuestion < 0) {
			return null;
		}
		
		var alreadyVotedCount = countAlreadyVoted(poll, userId);
		var currentTime = new Date();
		
		var remainingTimeToVote = currentTime >= poll.timeoutAt ? 0 : Math.floor((poll.timeoutAt - currentTime) / 1000);
		
		console.log('alreadyVotedCount=' + alreadyVotedCount);
		
		return { 'question': poll.questions[poll.currentQuestion],
		         'voted': alreadyVotedCount,
				 'timeout': remainingTimeToVote,
				 'current': (poll.currentQuestion + 1),
				 'total': poll.questions.length  };
	},

	/*
	This function is called by the poll's speaker
	It will move to the next question in the poll
	
	cbWhenMovedToNextQuestion: callback executed when the active question is changed. Receives the following parameters:
								current question: Current active question
								timeout: Time allowed to vote on this question (voting starts immediately)
								index of the current question: starts at 0 for the first question
								number of questions
								
	cbWhenPollCompleted: callback executed when the poll is completed (no more questions to show)
	                     When received, it allows you to free your resources (socket.io sockets for instance).
						 A callback is passed to this callback which you MUST execute.
						 
	cbWhenQuestionTimeout: callback executed when the active question's timer reaches zero (time allowed to vote is exhausted). No parameter is passed.
	
	cbErrorMoveNextQuestion: callback executed when it is impossible to go to the next question. For example when the poll is not loaded in memory
	*/
	goNextQuestion: function(pollId, cbWhenMovedToNextQuestion, cbWhenPollCompleted, cbWhenQuestionTimeout, cbErrorMoveNextQuestion) {
		console.log('Moving on to the next question in poll: ' + pollId);
		
		if (!polls.has(pollId)) {
			cbErrorMoveNextQuestion();
		} else {
			var poll = polls.get(pollId);
			
			if (poll.currentQuestion > -1 && poll.voteAllowed === true) {
				clearTimeout(poll.cancelTimeout);
				poll.cancelTimeout = null;
			}
			
			var moveVotesToDatabase = function(poll) {
										  var currentQuestion = poll.questions[poll.currentQuestion];
										  console.log('Moving votes to database. Current question: ' + currentQuestion._id);
										  console.log('currentQuestion.answers: ' + currentQuestion.answers);
										  
									      Poll.update({'questions._id': currentQuestion._id },
											          {'$set' : {'questions.$.answers' : currentQuestion.answers}},
													  function(err) {
														  if (err) {
															  console.log('ERROR while updating poll: ' + err);
														  }
													  })
									  };
			
			var executeWhenQuestionTimeout = function(poll) {
												poll.voteAllowed = false;
												moveVotesToDatabase(poll);
												cbWhenQuestionTimeout();
												
												if (poll.currentQuestion + 1 >= poll.questions.length) {
													cbWhenPollCompleted(function() {
														unloadPoll(poll, true, function() {});
													});
												}
											 };

			console.log('Questions count: ' + poll.questions.length);					 
			console.log('Current question index: ' + poll.currentQuestion);					 
			
			if (poll.currentQuestion + 1 >= poll.questions.length) {
				console.log('Poll completed');
				executeWhenQuestionTimeout(poll);
			} else {
				if (poll.currentQuestion > -1) {
					poll.questions[poll.currentQuestion] = {};
					// freeing memory. The last question is of no more use.
					// Don't delete poll.questions[poll.currentQuestion] though! since currentQuestion contains the index of the current question in the array.
				}
				
				// Incrementing the active question
				poll.currentQuestion = poll.currentQuestion + 1;

				var currentQuestion = poll.questions[poll.currentQuestion];

				// Setting the timeout of the current question
				currentQuestion.started = new Date();
				var timeoutTime = new Date();
				timeoutTime.setSeconds(timeoutTime.getSeconds() + currentQuestion.timeout);
				poll.timeoutAt = timeoutTime;
				
				poll.cancelTimeout = setTimeout(function() {
					executeWhenQuestionTimeout(poll);
				}, currentQuestion.timeout * 1000);
				
				poll.voteAllowed = true;
				
				cbWhenMovedToNextQuestion(currentQuestion, currentQuestion.timeout, poll.currentQuestion, poll.questions.length);
			}
		}
	},
	
	/*
	This function is called to determine the role of a user who wants to join the poll.
	
	Parameters:
	pollId: Id of the poll to join
	userId: Id of the user who wants to join the poll
	
	Returns either 'speaker' if the supplied user is the one who created the poll (and therefore must join it with the speaker console)
	        or 'audience' if the user is not the one who created the poll and therefore must join it as regular audience
	*/
	userJoinPoll: function(pollId, userId) {
		if (!polls.has(pollId)) {
			return false;
		}
		
		var poll = polls.get(pollId);
		
		return (poll.created_by == userId) ? 'speaker' : 'audience';
	},
	
	/*
	This function is called to retrieve basic poll metadata
	
	Parameters:
	pollId: Id of the poll that the user requests to obtain info about
	*/
	getPollDetails: function(pollId) {
		if (!polls.has(pollId)) {
			return false;
		}
		
		var poll = polls.get(pollId);
		
		return { 
			     'name': poll.name
			   };
	}
};