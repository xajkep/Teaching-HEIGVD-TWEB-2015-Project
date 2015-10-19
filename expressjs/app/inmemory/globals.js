var HashMap = require('hashmap');
var polls = new HashMap();

var mongoose = require('mongoose');
var Poll = mongoose.model('Poll');

module.exports = {
	loadPollInMemory: function(poll) {
		console.log('Loading poll in memory: ' + poll._id);
		
		if (polls.has(poll._id)) {
			return false;
		}

		poll.cancelTimeout = null;
		poll.currentQuestion = -1;
		poll.voteAllowed = false;
		
		polls.set(poll._id, poll);
		console.log('Poll added in memory');
		
		return true;
	},
	
	vote: function(pollId, answerIndex, userId) {
		if (!polls.has(pollId)) {
			return false;
		}
		
		var poll = polls.get(pollId);
		
		if (poll.voteAllowed !== true) {
			return false;
		}
		
		var question = poll.questions[poll.currentQuestion];
		var answersCount = question.answers.length;
		
		if (answerIndex < 0 || answerIndex >= answersCount) {
			return false;
		}
		
		var answer = question.answers[answerIndex];
		var alreadyVotedCount = 0;
		
		for (var i = 0; i < answersCount; ++i) {
			if (answer.users[i] == userId) {
				alreadyVotedCount = alreadyVotedCount + 1;
				
				if (alreadyVotedCount >= poll.maxVote) {
					return false;
				}
			}
		}

		answer.users.push(userId);
		
		return true;
	},
	
	getLiveResults: function(pollId) {
		if (!polls.has(pollId)) {
			return false;
		}

		var poll = polls.get(pollId);
		
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
			
			var executeWhenQuestionTimeout = function() {
												poll.voteAllowed = false;
												moveVotesToDatabase(poll);
												cbWhenQuestionTimeout();
											 };

			
			
			
			console.log('Questions count: ' + poll.questions.length);					 
			console.log('Current question index: ' + poll.currentQuestion);					 
			
			if (poll.currentQuestion + 1 >= poll.questions.length) {
				console.log('Poll completed');
				executeWhenQuestionTimeout();
				cbWhenPollCompleted();
			} else {
				poll.currentQuestion = poll.currentQuestion + 1;
				poll.voteAllowed = true;
				
				var currentQuestion = poll.questions[poll.currentQuestion];

				poll.cancelTimeout = setTimeout(executeWhenQuestionTimeout, currentQuestion.timeout * 1000);
				cbWhenMovedToNextQuestion(currentQuestion);
			}
		}
	},
	
	userJoinPoll: function(pollId, userId) {
		if (!polls.has(pollId)) {
			return false;
		}
		
		var poll = polls.get(pollId);

		if (poll.created_by == userId) {
			return 'speaker';
		} else {
			return 'audience';
		}
	}
};