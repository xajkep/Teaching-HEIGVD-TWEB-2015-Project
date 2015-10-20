var tweb = angular.module('tweb', ['ngRoute', 'ngAnimate', 'chart.js']);

tweb.directive("contenteditable", function() {
  return {
    restrict: "A",
    require: "ngModel",
    link: function(scope, element, attrs, ngModel) {

      function read() {
        ngModel.$setViewValue(element.html());
      }

      ngModel.$render = function() {
        element.html(ngModel.$viewValue || "");
      };

      element.bind("blur keyup change", function() {
        scope.$apply(read);
      });
    }
  };
});

/*
This factory is used to store data that is shared accross controllers
*/
tweb.factory('UserDataFactory', function () {
    var userData = {
        session: null
    };
	
    return {
		getSession: function() {
			return userData.session;
		},
		setSession: function(pSession) {
			userData.session = pSession;
		}
	}
});

tweb.factory('ServerPushPoll', function () {
	var _sio;
	var _connectedUsers = [];
	
	
	var _cbOnUserConnect = null;
	var _cbOnUserDisconnect = null;
	var _cbOnAudienceList = null;
	
	var _cbOnNextQuestion = null;
	var _cbOnPollCompleted = null;
	var _cbOnVotingOnThisQuestionEnded = null;
	var _cbOnVoteResult = null;
	
	var _cbOnLiveVoteResults = null;
	
	var _registerLiveVoteResults = function(cbOnLiveVoteResults) {
		_cbOnLiveVoteResults = cbOnLiveVoteResults
	}
	
	var _registerBasicPollEvents = function(cbOnNextQuestion, cbOnPollCompleted, cbOnVotingOnThisQuestionEnded, cbOnVoteResult) {
		_cbOnNextQuestion = cbOnNextQuestion;
		_cbOnPollCompleted = cbOnPollCompleted;
		_cbOnVotingOnThisQuestionEnded = cbOnVotingOnThisQuestionEnded;
		_cbOnVoteResult = cbOnVoteResult;
	};
	
	var _registerEventsWhenPeopleConnectAndDisconnect = function(cbOnUserConnect, cbOnUserDisconnect, cbOnAudienceList) {
		_cbOnUserConnect = cbOnUserConnect;
		_cbOnUserDisconnect = cbOnUserDisconnect;
		_cbOnAudienceList = cbOnAudienceList;
	};
	
	var _goNextQuestion = function() {
		_sio.emit('goNextQuestion');
	};
	
	var _vote = function(answerIndex) {
		_sio.emit('vote', answerIndex);
	};

	var _connect = function(host, port, session, pollIdToJoin, cbJoinedAsSpeaker, cbJoinedAsAudience) {
		_sio = io.connect(host + ':' + port);

		_sio.on('authAndJoinResult', function(authAndJoinResult) {
			if (authAndJoinResult.status == 'ok') {
				//alert('Join poll success, as: ' + authAndJoinResult.data);
				if (authAndJoinResult.data == 'speaker') {
					cbJoinedAsSpeaker();
				} else {
					cbJoinedAsAudience();
				}
			} else {
				alert('Join poll failure: ' + authAndJoinResult.messages.join());
			}
		});
		
		_sio.on('userConnect', function(user) {
			
			//alert('userConnect received');
			
			user.voted = false;
			_connectedUsers.push(user);
			//alert('New user: ' + user._id);

			if (_cbOnUserConnect != null) {
				_cbOnUserConnect(_connectedUsers);
			}
		});
		
		_sio.on('userDisconnect', function(user) {

			//alert('userDisconnect received');
		
			var newList = [];
			var usersCount = _connectedUsers.length;
			for (var i=0; i < usersCount; i++) {
				if (_connectedUsers[i]._id != user._id) {
					newList.push(_connectedUsers[i]);
				}
			}

			_connectedUsers = newList;

			if (_cbOnUserDisconnect != null) {
				_cbOnUserDisconnect(_connectedUsers);
			}
		});
		
		_sio.on('audienceList', function(audienceList) {

			_connectedUsers = audienceList;
			
			//alert('audienceList received');

			if (_cbOnAudienceList != null) {
				_cbOnAudienceList(_connectedUsers);
			}
		});

		_sio.on('nextQuestion', function(nextQuestion) {
			
			//alert('nextQuestion received');
			
			var usersCount = _connectedUsers.length;
			for (var i=0; i < usersCount; i++) {
				_connectedUsers[i].voted = false;
			}
			
			if (_cbOnNextQuestion != null) {
				_cbOnNextQuestion(nextQuestion);
			}
		});
		
		_sio.on('pollCompleted', function() {
			if (_cbOnPollCompleted != null) {
				_cbOnPollCompleted();
			}
		});
		
		_sio.on('votingOnThisQuestionEnded', function() {
			if (_cbOnVotingOnThisQuestionEnded != null) {
				_cbOnVotingOnThisQuestionEnded();
			}
		});
		
		_sio.on('voteResult', function(result) {
			if (_cbOnVoteResult != null) {
				_cbOnVoteResult(result);
			}
		});
		
		_sio.on('liveVoteResults', function(results) {

			var usersCount = _connectedUsers.length;
			for (var i=0; i < usersCount; i++) {
				if (_connectedUsers[i]._id == results.whovoted) {
					_connectedUsers[i].voted = true;
				}
			}
			
			if (_cbOnLiveVoteResults != null) {
				_cbOnLiveVoteResults(results);
			}
		});
		
		_sio.on('connect', function() {
			//alert('Socket connected');
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
		registerLiveVoteResults: _registerLiveVoteResults
	}
});

/*
tweb.factory('BuildPollFactory', function () {
    var userData = {
        poll: null
    };
	
    return {
		getPoll: function() {
			return userData.poll;
		},
		setPoll: function(pPoll) {
			userData.poll = pPoll;
		}
	}
});
*/

tweb.config(['$routeProvider',
        function($routeProvider) {
            $routeProvider.
                when('/', {
                    templateUrl: 'res/partials/home.html',
                    controller: 'home'
                }).
                when('/login', {
                    templateUrl: 'res/partials/login.html',
                    controller: 'login'
                }).
				when('/polls', {
                    templateUrl: 'res/partials/polls.html',
                    controller: 'polls'
                }).
				when('/join', {
                    templateUrl: 'res/partials/join.html',
                    controller: 'join'
                }).
				when('/register', {
                    templateUrl: 'res/partials/register.html',
                    controller: 'register'
                }).
				when('/polldetails', {
                    templateUrl: 'res/partials/polldetails.html',
                    controller: 'polldetails'
                }).
				when('/polljoin', {
                    templateUrl: 'res/partials/polljoin.html',
                    controller: 'polljoin'
                }).
				when('/pollspeaker', {
                    templateUrl: 'res/partials/pollspeaker.html',
                    controller: 'pollspeaker'
                }).
				when('/pollaudience', {
                    templateUrl: 'res/partials/pollaudience.html',
                    controller: 'pollaudience'
                }).
                otherwise({
                    redirectTo: '/login'
                });
        }]);

tweb.controller('home', function($scope) {
	$scope.message = 'Page: home';
});

tweb.controller('login', function($scope, $http, $location, UserDataFactory) {
	// DEBUG TO-DO
	$scope.user = {
		'email': 'test@test.com',
		'password': 'TestTest1991'
	};
	
	$scope.login = function() {

		var submittedEmail = $scope.user.email;
		var submittedPassword = $scope.user.password;

		$http.post("/api/v1/account", {
			email: submittedEmail,
			password: submittedPassword
		})
		.success(function(data, status, headers, config) {
			if (data.status == 'ok') {
				UserDataFactory.setSession(data.data.session);
				//alert('Logged in. Redirecting');
				$location.path("/polls");
			} else {
				alert("Could not login: " + data.messages.join());
			}
		}).error(function(data, status, headers, config) {
			$scope.msg2 = data;
		});
	};
});



tweb.controller('pollspeaker', function($scope, $location, UserDataFactory, ServerPushPoll) {
	$scope.userSession = UserDataFactory.getSession();
	
	$scope.connected = ServerPushPoll.connectedUsers;
	$scope.currentQuestion = {};
	$scope.displayQuestion = false;
	$scope.votingIsAllowed = false;
	$scope.goNextQuestionAllowed = true;
	$scope.timerHdl = null;
	$scope.timerRemaining = 0;
	
	$scope.startTimer = function() {
		$scope.timerHdl = setInterval(function() {
									     $scope.timerRemaining = $scope.timerRemaining - 1;
										 $scope.$apply();
										 
										 if ($scope.timerRemaining <= 0) {
											 $scope.stopTimer();
										 }
									 }, 1000);
	};
	
	$scope.stopTimer = function() {
		if ($scope.timerHdl != null) {
			clearTimeout($scope.timerHdl);
			$scope.timerHdl = null;
		}
	};
	
	$scope.goNextQuestion = function() {
		$scope.goNextQuestionAllowed = false;
		ServerPushPoll.goNextQuestion();
	};

	$scope.labels = [];
	$scope.data = [];
	$scope.options = { animationSteps: 20 };

	ServerPushPoll.registerEventsWhenPeopleConnectAndDisconnect(function(newConnectedList) {
																	//alert('userconnect processing');
																	// One user joined
																	$scope.connected = newConnectedList;
																	$scope.$apply();
															    },
																// Workaround. Even $apply doesn't work. Enjoy.
																function(newConnectedList) {
																	//alert('userDisconnect processing');
																	// One user disconnected
																	$scope.connected = newConnectedList;
																	$scope.$apply();
																},
																function(newConnectedList) {
																	//alert('audienceList processing');
																	// When the speaker joins, the list of already connected is received
																	$scope.connected = newConnectedList;
																	$scope.$apply();
																});
																

	ServerPushPoll.registerBasicPollEvents(function(question) {
		
											   // question.voted is unused
											   var nextQuestion = question.question;
											   var timeout = question.timeout;
		
											   $scope.timerRemaining = timeout;
											   $scope.startTimer();
		
											   // Next question
											   $scope.votingIsAllowed = true;
											   
											   var graphLabels = [];
											   var graphValues = [];
											   var answersCount = nextQuestion.answers.length;
											   for (var i = 0; i < answersCount; i++) {
												   nextQuestion.answers[i].count = 0;
												   graphLabels.push(nextQuestion.answers[i].name);
												   graphValues.push(0);
											   }

											   $scope.labels = graphLabels;
											   $scope.data = graphValues;
											   
											   $scope.currentQuestion = nextQuestion;
											   $scope.displayQuestion = true;
											   
											   $scope.$apply();
										   },
										   function() {
											   // Poll completed
											   $scope.votingIsAllowed = false;
											   $scope.goNextQuestionAllowed = false;
											   $scope.stopTimer();
											   $scope.$apply();
										   },
										   function() {
											   // Question timeout
											   $scope.votingIsAllowed = false;
											   $scope.goNextQuestionAllowed = true;
											   $scope.stopTimer();
											   $scope.$apply();
										   },
										   function(voteResult) {
											   // Vote result
											   // Do nothing. The speaker cannot vote.
										   });

	ServerPushPoll.registerLiveVoteResults(function(results) {
											   var resultsCount = results.results.length;
											   var graphValues = [];
											   for (var i = 0; i < resultsCount; i++) {
												   var count = results.results[i].count;
												   $scope.currentQuestion.answers[i].count = count;
												   graphValues.push(count);
											   }
											   
											   $scope.data = graphValues;
											   $scope.$apply();
										   });
});

tweb.controller('pollaudience', function($scope, $location, UserDataFactory, ServerPushPoll) {
	$scope.userSession = UserDataFactory.getSession();

	$scope.currentQuestion = {};
	$scope.displayQuestion = false;
	$scope.votingIsAllowed = false;
	$scope.voteRegistered = false;
	$scope.voteCountOnThisQuestion = 0;
	
	$scope.startTimer = function() {
		$scope.timerHdl = setInterval(function() {
									     $scope.timerRemaining = $scope.timerRemaining - 1;
										 $scope.$apply();
										 
										 if ($scope.timerRemaining <= 0) {
											 $scope.stopTimer();
										 }
									 }, 1000);
	};
	
	$scope.stopTimer = function() {
		if ($scope.timerHdl != null) {
			clearTimeout($scope.timerHdl);
			$scope.timerHdl = null;
		}
	};
	
	$scope.vote = function(answerIndex) {
		$scope.currentQuestion.answers[answerIndex].voted = true;
		ServerPushPoll.vote(answerIndex);
	}
	
	ServerPushPoll.registerBasicPollEvents(function(question) {
											   var nextQuestion = question.question;
											   var timeout = question.timeout;
		
											   $scope.timerRemaining = timeout;
											   $scope.startTimer();
		
											   // Next question
											   $scope.voteCountOnThisQuestion = question.voted;
											   $scope.voteRegistered = false;
											   $scope.votingIsAllowed = true;
											   $scope.currentQuestion = nextQuestion;
											   $scope.displayQuestion = true;
											   $scope.$apply();
											   //alert('Next question: ' + question.question.name);
										   },
										   function() {
											   // Poll completed
											   $scope.stopTimer();
											   $scope.votingIsAllowed = false;
											   $scope.$apply();
											   alert('Poll completed');
										   },
										   function() {
											   // Question timeout
											   $scope.stopTimer();
											   $scope.votingIsAllowed = false;
											   $scope.$apply();
											   //alert('Question timeout');
										   },
										   function(voteResult) {
											   // Vote result
											   if (voteResult.status == 'ok') {
												   $scope.voteCountOnThisQuestion = $scope.voteCountOnThisQuestion + 1;
												   $scope.voteRegistered = true;
												   
												   
												   if ($scope.voteCountOnThisQuestion >= $scope.currentQuestion.maxVote) {
													   $scope.votingIsAllowed = false;
												   }
												   
												   $scope.$apply();

												   //alert('Vote registered');
											   } else {
												   alert('Cannot vote: ' + voteResult.messages.join());
											   }
										   });	
});


tweb.controller('polljoin', function($scope, $location, UserDataFactory, ServerPushPoll) {
	$scope.userSession = UserDataFactory.getSession();
	var pollIdToJoin = $location.search().id;

	//alert('Joining poll: ' + pollIdToJoin);
	socketIOConnectToServer(ServerPushPoll,
	                        UserDataFactory.getSession(),
	                        pollIdToJoin,
							function() {
							   $location.path("/pollspeaker");
							   $scope.$apply();
						   }, function() {
								$location.path("/pollaudience");
								$scope.$apply();
						   }
	);
	
});

function socketIOConnectToServer(spp, session, pollIdToJoin, cbAsSpeaker, cbAsAudience) {
	var socketIOPort = 8090;
	spp.connect('http://localhost', socketIOPort, session, pollIdToJoin,
	            cbAsSpeaker, cbAsAudience);
}

tweb.controller('polls', function($scope, $http, $location, UserDataFactory, ServerPushPoll) {
	$scope.userSession = UserDataFactory.getSession();

	$scope.createPoll = function() {
		$location.path("/polldetails");
	}
	
	$scope.joinPoll = function(pollIdToJoin) {
		socketIOConnectToServer(ServerPushPoll, UserDataFactory.getSession(), pollIdToJoin,
							function() {
							   $location.path("/pollspeaker");
							   $scope.$apply();
						   }, function() {
								$location.path("/pollaudience");
								$scope.$apply();
						   });
	}
	
	$scope.openPoll = function(pollId) {
		$http({
			method: 'POST',
			url: "/api/v1/poll/" + pollId,
			cache: false,
			headers: {
				'Authorization': $scope.userSession
			}
		})
		.success(function(data, status, headers, config) {
			if (data.status == 'ok') {
				//alert('Poll is now open: ' + pollId);
				$location.path("/polljoin").search({ 'id': pollId });
			} else {
				alert("Could not open poll: " + data.messages.join());
			}
		}).error(function(data, status, headers, config) {
			alert("Could not open poll: http error");
		});
	}
	
	// User's polls
	$scope.polls = [];
	
	// Search results
	$scope.search = {
		users: []
	};
	
	if (UserDataFactory.getSession() == null) {
		alert("Please login first");
		$location.path("login");
	} else {
		$http({
			method: 'GET',
			url: "/api/v1/polls",
			cache: false,
			headers: {
				'Authorization': $scope.userSession
			}
		})
		.success(function(data, status, headers, config) {
			if (data.status == 'ok') {
				$scope.polls = data.data;
			} else {
				alert("Could not retrieve polls: " + data.messages.join());
			}
		}).error(function(data, status, headers, config) {
			alert("Could not retrieve polls: http error");
		});

		$scope.$watch('searchText', function (val) {
			if (val != '' && val != undefined && val.length >= 3){
				$http({
					method: 'GET',
					url: "/api/v1/users/email/" + val,
					cache: false,
					headers: {
						'Authorization': $scope.userSession
					}
				})
				.success(function(data, status, headers, config) {
					if (data.status == 'ok') {
						$scope.search.users = data.data;
					} else {
						alert("Could not retrieve users by email: " + data.messages.join());
					}
				}).error(function(data, status, headers, config) {
					alert("Could not retrieve users by email: http error");
				});
			} else {
				$scope.search.users = [];
			}
		});
	}
});

tweb.controller('join', function($scope) {
	$scope.message = 'Page: join';
});

tweb.controller('register', function($scope, $http, $location, UserDataFactory) {
	$scope.register = function() {

		if (UserDataFactory.getSession() != null) {
			alert('You are already logged in');
		} else {
		
			var errors = [];
	
			var submittedFirstname = $scope.user.firstname;
			var submittedLastname = $scope.user.lastname;
			var submittedEmail = $scope.user.email;
			var submittedPassword1 = $scope.user.password1;
			var submittedPassword2 = $scope.user.password2;

			if (submittedPassword1 != submittedPassword2) {
				errors.push('Password do not match');
			}
			
			$http.put("/api/v1/register", {
				email: submittedEmail,
				firstname: submittedFirstname,
				lastname: submittedLastname,
				password: submittedPassword1
			})
			.success(function(data, status, headers, config) {
				if (data.status == 'ok') {
					alert('Registered.');
					$location.path("/login");
				} else {
					alert("Could not register: " + data.messages.join());
				}
			}).error(function(data, status, headers, config) {
			});
		}
	};
});

tweb.controller('polldetails', function($scope, $location, $http, UserDataFactory) {
	
	if (UserDataFactory.getSession() == null) {
		alert("Please login first");
		$location.path("login");
	} else {
		
		var poll = {
			name: 'SuperPOLL',
			questions: [
						{
							name: 'How is the weather today?',
							allowAnonymous: false,
							maxVote: 5,
							timeout: 30,
							answers: [
									{
									   name: 'Good'
									},
									{
									   name: 'Not bad'
									},
									{
									   name: 'Excellent'
									},
									{
									   name: 'Could be better'
									}]
						},
						{
							name: 'Yes or no?',
							allowAnonymous: false,
							maxVote: 5,
							timeout: 30,
							answers: [
									{
									   name: 'Yes'
									},
									{
									   name: 'No'
									}]
						}]
		}
		
		
		$scope.addAnswer = function(pos) {
			$scope.poll.questions[pos].answers.push({
				name: 'New answer'
			});
			
			$scope.$apply();
		}
		
		
		$scope.deleteQuestion = function(pos) {
			var questionsQty = $scope.poll.questions.length;

			var questions = [];
			for (var i = 0; i < questionsQty;i++) {
				if (i != pos) {
					questions.push($scope.poll.questions[i]);
				}
			}
			
			$scope.poll.questions = questions;
			
			$scope.$apply();
		}
		
		$scope.deleteAnswer = function(questionPos, answerPos) {
			
			var answersQty = $scope.poll.questions[questionPos].answers.length;
			var question = $scope.poll.questions[questionPos];
			
			var answers = [];
			for (var i = 0; i < answersQty;i++) {
				if (i != answerPos) {
					answers.push(question.answers[i]);
				}
			}
			
			question.answers = answers;

			$scope.$apply();
		}
		
		$scope.inverseQuestionOrder = function(pos1, pos2) {
			var temp = $scope.poll.questions[pos1];
			$scope.poll.questions[pos1] = $scope.poll.questions[pos2];
			$scope.poll.questions[pos2] = temp;
			
			$scope.$apply();
		}
		
		$scope.inverseAnswerOrder = function(question, pos1, pos2) {
			var temp = $scope.poll.questions[question].answers[pos1];
			$scope.poll.questions[question].answers[pos1] = $scope.poll.questions[question].answers[pos2];
			$scope.poll.questions[question].answers[pos2] = temp;
			
			$scope.$apply();
		}
		
		
		$scope.addQuestionAtPos = function(pos) {
									  var newQuestion = {
										  name: 'What do you prefer?',
										  allowAnonymous: false,
										  maxVote: 1,
										  timeout: 30,
										  answers: [{
														name: 'Yellow'
													},
													{
														name: 'Orange'
													}]
									  }

									  $scope.poll.questions.splice(pos, 0, newQuestion);
									  
									  $scope.$apply();
								  };
		
		
		$scope.save = function() {
			var errors = [];
			var questionsCount = $scope.poll.questions.length;
			var pollNameLength = $scope.poll.name.length;
			
			if (pollNameLength < 3) {
				errors.push('Poll name is too short');
			} else if (pollNameLength > 50) {
				errors.push('Poll name is too long');
			}
			
			if (questionsCount < 1) {
				errors.push('The poll must have at least one question');
			}
			
			for (var i=0;i<questionsCount;i++) {
				var currentQuestion = $scope.poll.questions[i];
				var currentQuestionNameLength = currentQuestion.name.length;

				if (currentQuestionNameLength < 5) {
					errors.push('Question ' + i + ': question name is too short');
				} else if (currentQuestionNameLength > 30) {
					errors.push('Question ' + i + ': question name is too long');
				}
				
				var answersCount = currentQuestion.answers.count;
				
				if (answersCount < 2) {
					errors.push('Question ' + (i + 1) + ': must have at least 2 answers');
				}
				
				for (var y=0;y<answersCount;y++) {
					var currentAnswerNameLength = currentQuestion.answers[y].name.length;
					
					if (currentAnswerNameLength < 1) {
						errors.push('Question ' + (i + 1) + ' answer ' + (y + 1) + ': name is too short');
					} else if (currentAnswerNameLength > 30) {
						errors.push('Question ' + (i + 1) + ' answer ' + (y + 1) + ': name is too long');
					}
				}
			}
			
			if (errors.length == 0) {
				var userSession = UserDataFactory.getSession();

				$http({
					method: 'PUT',
					url: "/api/v1/poll",
					data: $scope.poll,
					cache: false,
					headers: {
						'Authorization': userSession
					}
				})
				.success(function(data, status, headers, config) {
					if (data.status == 'ok') {
						alert('Poll created.');
					} else {
						alert("Could not create poll: " + data.messages.join());
					}
				}).error(function(data, status, headers, config) {
					alert("Could not create poll: http error");
				});
			} else {
				alert(errors.join());
			}
		}
		
		$scope.poll = poll;
	}
});
