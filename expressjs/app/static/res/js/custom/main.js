var tweb = angular.module('tweb', ['ngRoute', 'ngAnimate', 'chart.js']);

/*
This factory is used to store data that is shared accross controllers
*/
tweb.factory('UserDataFactory', function () {
	
	// The session attribute is the session obtained from the server
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

/*
This factory is used as a helper to format error messages received in response from the REST API
in order to display the returned human readable errors
*/
tweb.factory('DisplayErrorMessagesFromAPI', function () {
    return function(errors) {
		var errorsDescriptions = [];
		
		for (var i=0;i<errors.length;i++) {
			errorsDescriptions.push(errors[i].description);
		}
		
		return errorsDescriptions.join("\n");
	};
});

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
				alert('Join poll failure: ' + DisplayErrorMessagesFromAPI(authAndJoinResult.messages));
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
				when('/pollview', {
                    templateUrl: 'res/partials/pollview.html',
                    controller: 'pollview'
                }).
				when('/changepassword', {
                    templateUrl: 'res/partials/changepassword.html',
                    controller: 'changepassword'
                }).
                otherwise({
                    redirectTo: '/login'
                });
        }]);

tweb.controller('home', function($scope, $http) {
	$scope.usersCount = 0;
	$scope.pollsCount = 0;
	$scope.openPollsCount = 0;

	$scope.$on('$viewContentLoaded', function() {
		// Retrieving the stats from the REST API
		$http({
			method: 'GET',
			url: "/api/v1/stats/",
			cache: false
		})
		.success(function(data, status, headers, config) {
			$scope.usersCount = data.usersCount;
			$scope.pollsCount = data.pollsCount;
			$scope.openPollsCount = data.openPollsCount;
		}).error(function(data, status, headers, config) {
			alert("Could not retrieve stats: http error");
		});
	});
});

tweb.controller('login', function($scope, $http, $location, UserDataFactory, DisplayErrorMessagesFromAPI) {
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
				// We store the session in the factory, so other controllers can access later it as well
				UserDataFactory.setSession(data.data.session);
				$location.path("/polls");
			} else {
				alert("Could not login: " + DisplayErrorMessagesFromAPI(data.messages));
			}
		}).error(function(data, status, headers, config) {
			$scope.msg2 = data;
		});
	};
});



tweb.controller('pollspeaker', function($scope, $location, UserDataFactory, ServerPushPoll) {
	$scope.userSession = UserDataFactory.getSession();
	
	// The poll id is a GET parameter
	var pollId = $location.search().id;
	
	// Poll name
	$scope.pollName = '';
	
	// Position in the poll
	$scope.currentQuestionNumber = 0;
	
	// Number of questions in the poll
	$scope.totalQuestions = 0;
	
	$scope.connected = ServerPushPoll.connectedUsers;
	$scope.currentQuestion = {};
	$scope.displayQuestion = false;
	$scope.votingIsAllowed = false;
	$scope.goNextQuestionAllowed = true;
	$scope.hasPollEnded = false;
	$scope.timerHdl = null;
	$scope.timerRemaining = 0;
	$scope.votingAsAnonymousIsAllowed = false;
	
	$scope.totalVotesCount = 0;
	
	// This is the activity graph
	var chartVotingActivity;
	var chartVotingActivityData = [
			{
				label: 'Votes',
				strokeColor: '#A31515',
				data: [{
					x: 0,
					y: 0
				}]
			}];
	
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
	
	$scope.viewPollResults = function() {
		$location.path("/pollview").search({ 'id': pollId });
	};

	$scope.labels = [];
	$scope.data = [];
	$scope.options = { animationSteps: 20 };

	ServerPushPoll.registerEventsWhenPeopleConnectAndDisconnect(function(newConnectedList) {
																	// One user joined
																	$scope.connected = newConnectedList;
																	$scope.$apply();
															    },
																// Workaround. Even $apply doesn't work. Enjoy.
																function(newConnectedList) {
																	// One user disconnected
																	$scope.connected = newConnectedList;
																	$scope.$apply();
																},
																function(newConnectedList) {
																	// When the speaker joins, the list of already connected is received
																	$scope.connected = newConnectedList;
																	$scope.$apply();
																});
																

	ServerPushPoll.registerBasicPollEvents(function() {
												// Never happens for the speaker
											},
											function(pollDetails) {
												$scope.$apply(function() {
													$scope.pollName = pollDetails.name;
												});
											}, function(question) {
		
											   // question.voted is unused
											   var nextQuestion = question.question;
											   var timeout = question.timeout;
		
											   $scope.timerRemaining = timeout;
											   
											   if (timeout > 0) {
													$scope.startTimer();
													$scope.currentQuestionNumber = question.current;
													$scope.totalQuestions = question.total;
													
													// Next question
													$scope.votingIsAllowed = true;
													$scope.votingAsAnonymousIsAllowed = nextQuestion.allowAnonymous;
													$scope.goNextQuestionAllowed = false;
											   }

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

											   $scope.totalVotesCount = 0;
											   $scope.createPartitipationGraph();
											   
											   $scope.$apply();
										   },
										   function() {
											   // Poll completed
											   $scope.hasPollEnded = true;
											   $scope.votingIsAllowed = false;
											   $scope.goNextQuestionAllowed = false;
											   $scope.stopTimer();
											   $scope.$apply();
											   
											   ServerPushPoll.disconnect();
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
											   var timing = results.timing;
											   var resultsCount = results.results.length;
											   var graphValues = [];
											   for (var i = 0; i < resultsCount; i++) {
												   var count = results.results[i].count;
												   $scope.currentQuestion.answers[i].count = count;
												   graphValues.push(count);
											   }
											   
											   $scope.data = graphValues;
											  
											   
											   $scope.totalVotesCount = $scope.totalVotesCount + 1;
											   
											   // null when catching up
											   if (timing != null) {
												   chartVotingActivity.datasets[0].addPoint(timing, $scope.totalVotesCount);
												   chartVotingActivity.update();
											   }
											   
											   $scope.$apply();
										   });
										   
	// This will include the partitipation graph in the poll. This graph has no Angular binding
	$scope.createPartitipationGraph = function() {
		var ctx3 = document.getElementById("votingactivity").getContext("2d");
		chartVotingActivity = new Chart(ctx3).Scatter(chartVotingActivityData, {
			bezierCurve: false,
			showTooltips: false,
			scaleShowHorizontalLines: true,
			scaleShowLabels: false,
			scaleBeginAtZero : true,
			scaleType: "number",
			scaleShowVerticalLines: false,
			scaleLabel: "<%=value%> votes"
		});
	};
	
	$scope.$on('$viewContentLoaded', function() {
		$scope.createPartitipationGraph();

		ServerPushPoll.catchUp();
	});
});

tweb.controller('pollaudience', function($scope, $location, UserDataFactory, ServerPushPoll, DisplayErrorMessagesFromAPI) {
	$scope.userSession = UserDataFactory.getSession();

	// The poll id is a GET parameter
	var pollId = $location.search().id;
	
	$scope.pollName = '';
	$scope.currentQuestion = {};
	$scope.displayQuestion = false;
	$scope.votingIsAllowed = false;
	$scope.voteRegistered = false;
	$scope.voteCountOnThisQuestion = 0;
	$scope.votingAsAnonymousIsAllowed = false;
	
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
	
	$scope.vote = function(answerIndex, voteAsAnonymous) {
		$scope.currentQuestion.answers[answerIndex].voted = true;
		ServerPushPoll.vote(answerIndex, voteAsAnonymous);
	}
	
	var redirectToPolls = function() {
		ServerPushPoll.disconnect();
		$location.path("/polls");
	};
	
	ServerPushPoll.registerBasicPollEvents(function() {
												// When the same user already has a connection for the same poll 
												$scope.votingIsAllowed = false;
												$scope.$apply();
												alert('This session has been terminated because you joined the same poll again.');
											},
											function(pollDetails) {
												// Poll details
												$scope.$apply(function() {
													$scope.pollName = pollDetails.name;
												});
											}, function(question) {
												// Next question (is also used as a catchUp)
											   var nextQuestion = question.question;
											   var timeout = question.timeout;
		
											   $scope.timerRemaining = timeout;
											   $scope.voteCountOnThisQuestion = question.voted;
		
											   if (timeout > 0) {
													$scope.startTimer();
													$scope.votingIsAllowed = $scope.voteCountOnThisQuestion < nextQuestion.maxVote;
													$scope.votingAsAnonymousIsAllowed = nextQuestion.allowAnonymous;
											   } else {
												   $scope.votingIsAllowed = false;
											   }

											   $scope.voteRegistered = false;
											   $scope.currentQuestion = nextQuestion;
											   $scope.displayQuestion = true;
											   $scope.$apply();
										   },
										   function() {
											   // Poll completed
											   $scope.stopTimer();
											   $scope.votingIsAllowed = false;

											   redirectToPolls();
											   
											   $scope.$apply();
										   },
										   function() {
											   // Question timeout
											   $scope.stopTimer();
											   $scope.votingIsAllowed = false;
											   $scope.$apply();
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
											   } else {
												   alert("Cannot vote:\n" + DisplayErrorMessagesFromAPI(voteResult.messages));
											   }
										   });
										   
	ServerPushPoll.catchUp();
});


tweb.controller('polljoin', function($scope, $location, UserDataFactory, ServerPushPoll) {
	$scope.userSession = UserDataFactory.getSession();
	var pollIdToJoin = $location.search().id;

	socketIOConnectToServer(ServerPushPoll,
	                        UserDataFactory.getSession(),
	                        pollIdToJoin,
							function() {
							   $location.path("/pollspeaker").search({ 'id': pollIdToJoin });
							   $scope.$apply();
						   }, function() {
								$location.path("/pollaudience").search({ 'id': pollIdToJoin });
								$scope.$apply();
						   }
	);
	
});

/*
spp: Reference to the shared ServerPushPoll factory
session: User session obtained from the server
pollIdToJoin: id of the poll you want to join
cbAsSpeaker: callback to execute when the server decides to make you join as a speaker
cbAsAudience: callback to execute when the server decides to make you join as an audience member
*/
function socketIOConnectToServer(spp, session, pollIdToJoin, cbAsSpeaker, cbAsAudience) {
	spp.connect(null, null, session, pollIdToJoin,
	            cbAsSpeaker, cbAsAudience);
}


tweb.controller('pollview', function($scope, $http, $location, $timeout, UserDataFactory, DisplayErrorMessagesFromAPI) {
	$scope.userSession = UserDataFactory.getSession();
	
	var pollId = $location.search().id;
	
	$scope.graphOptions = { animationSteps: 40 };
	
	$scope.goBack = function() {
		$location.path("/polls");
	};
	
	// Including the participation graph for each question. This graph has no Angular binding
	$scope.createPartitipationGraph = function(element, data) {
		var ctx3 = document.getElementById(element).getContext("2d");
		var chartVotingActivity = new Chart(ctx3).Scatter(data, {
			bezierCurve: false,
			showTooltips: false,
			scaleShowHorizontalLines: true,
			scaleShowLabels: false,
			scaleBeginAtZero : true,
			scaleType: "number",
			scaleShowVerticalLines: false,
			scaleLabel: "<%=value%> votes"
		});
	};

	var poll = {
		name: '',
		questions: []
	}; 

	$scope.$on('$viewContentLoaded', function() {
		// Retrieving poll stats
		$http({
			method: 'GET',
			url: "/api/v1/poll/" + pollId,
			cache: false,
			headers: {
				'Authorization': $scope.userSession
			}
		})
		.success(function(data, status, headers, config) {
			if (data.status == 'ok') {
				var poll = data.data;

				// Building data for plotting
				var questionsCount = poll.questions.length;
				for (var i=0; i<questionsCount;i++) {
					var graphLabels = [];
					var graphValues = [];
					var currentQuestion = poll.questions[i];							
					
					
					var allTimings = [];

					var answersCount = currentQuestion.answers.length;
					for (var y=0; y<answersCount;y++) {
						var currentAnswer = currentQuestion.answers[y];
						var anonymousAnswersCount = 0;
						var distinctUsersIds = [];
						var distinctUsers = [];
						
						graphLabels.push(currentAnswer.name);
						graphValues.push(currentAnswer.users.length);
						
						for (var k=0;k<currentAnswer.users.length;k++) {
							var currentUser = currentAnswer.users[k];
							
							allTimings.push(currentUser.timing);
							
							if (currentUser.anonymous) {
								anonymousAnswersCount = anonymousAnswersCount + 1;
							} else {
								var userId = currentUser.user._id;
								
								if (distinctUsersIds.indexOf(userId) < 0) {
									currentUser.user.voted = 1;
									
									distinctUsersIds.push(userId);
									distinctUsers.push(currentUser.user);
								} else {
									for (var z=0;z<distinctUsers.length;z++) {
										if (distinctUsers[z]._id == userId) {
											distinctUsers[z].voted++;
										}
									}
								}
							}
						}

						currentAnswer.anonymousAnswersCount = anonymousAnswersCount;
						currentAnswer.distinctUsers = distinctUsers;
					}
					
					// Sorting timings so the graph can be plotted correctly
					allTimings.sort(function(a, b) {
										return a - b;
									});
					
					var votesCount = 0;
					var chartVotingActivityOnlyData = [];
					
					chartVotingActivityOnlyData.push({'x': 0, 'y': 0 });
					
					for (var participation = 0; participation < allTimings.length; participation++) {
						votesCount = votesCount + 1;
						chartVotingActivityOnlyData.push({'x': allTimings[participation], 'y': votesCount });
					}

					currentQuestion.chartVotingActivityData = [
																{
																	'label': 'Votes',
																	'strokeColor': '#A31515',
																	'data': chartVotingActivityOnlyData
																}];
	
					currentQuestion.graph = {
						'labels': graphLabels,
						'values': graphValues
					};
				}

				$scope.poll = poll;
				
				// For each question, creating the participation graph. This is done as soon as the view loads
				$timeout(function () {
					for (var i=0;i<$scope.poll.questions.length;i++) {
						$scope.createPartitipationGraph('participationchart' + i, $scope.poll.questions[i].chartVotingActivityData);
					}
				});
			} else {
				alert("Could not retrieve poll: " + DisplayErrorMessagesFromAPI(data.messages));
			}
		}).error(function(data, status, headers, config) {
			alert("Could not retrieve poll: http error");
		});
	});

});

tweb.controller('polls', function($scope, $http, $location, UserDataFactory, ServerPushPoll, DisplayErrorMessagesFromAPI) {
	$scope.userSession = UserDataFactory.getSession();

	$scope.logout = function() {
		$location.path("/login");
	};
	
	$scope.createPoll = function() {
		$location.path("/polldetails").search('mode', 'new');
	};
	
	$scope.deletePoll = function(pollId) {
		// Requesting the server to delete the poll
		$http({
				method: 'DELETE',
				url: "/api/v1/poll/" + pollId,
				cache: false,
				headers: {
					'Authorization': $scope.userSession
				}
			})
			.success(function(data, status, headers, config) {
				if (data.status == 'ok') {
					
					// Removing the poll from the displayed polls.
					// This saves a request to the server to get the user's poll
					// Warning, delete $scope.polls[i] does not work and breaks the binding!
					var polls = [];
					
					for (var i = 0; i < $scope.polls.length; i++) {
						var currentPoll = $scope.polls[i];
						
						if (currentPoll._id != pollId) {
							polls.push(currentPoll);
						}
					}
					
					$scope.polls = polls;
				
				} else {
					alert("Could not delete poll: " + DisplayErrorMessagesFromAPI(data.messages));
				}
			}).error(function(data, status, headers, config) {
				alert("Could not delete poll: http error");
			});
	};
	
	$scope.viewPollResults = function(pollId) {
		$location.path("/pollview").search({ 'id': pollId });
	};
	
	$scope.joinPoll = function(pollIdToJoin) {
		socketIOConnectToServer(ServerPushPoll, UserDataFactory.getSession(), pollIdToJoin,
							function() {
							   $location.path("/pollspeaker");
							   $scope.$apply();
						   }, function() {
								$location.path("/pollaudience");
								$scope.$apply();
						   });
	};
	
	$scope.openPoll = function(pollId) {
		$http({
			method: 'POST',
			url: "/api/v1/poll/opened/" + pollId,
			cache: false,
			headers: {
				'Authorization': $scope.userSession
			}
		})
		.success(function(data, status, headers, config) {
			if (data.status == 'ok') {
				$location.path("/polljoin").search({ 'id': pollId });
			} else {
				alert("Could not open poll: " + DisplayErrorMessagesFromAPI(data.messages));
			}
		}).error(function(data, status, headers, config) {
			alert("Could not open poll: http error");
		});
	};
	
	$scope.editPoll = function(pollId) {
		$location.path("/polldetails").search('mode', 'edit').search('id', pollId);
	}
	
	// User's polls
	$scope.polls = [];
	
	// Search by email results
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
				alert("Could not retrieve polls: " + DisplayErrorMessagesFromAPI(data.messages));
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
						alert("Could not retrieve users by email: " + DisplayErrorMessagesFromAPI(data.messages));
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

tweb.controller('changepassword', function($scope, $http, $location, UserDataFactory, DisplayErrorMessagesFromAPI) {
	
	$scope.user = {
		'newpassword1': '',
		'newpassword2': ''
	};
	
	$scope.changePassword = function() {

		var userSession = UserDataFactory.getSession();
	
		if (userSession == null) {
			alert("Please login first");
			$location.path("login");
		} else {
			var errors = [];

			var submittedPassword1 = $scope.user.newpassword1;
			var submittedPassword2 = $scope.user.newpassword2;

			if (submittedPassword1 != submittedPassword2) {
				errors.push('Passwords do not match');
			}
			
			$scope.user = {
				'newpassword1': '',
				'newpassword2': ''
			};

			if (errors.length == 0) {
				// Sending the request to update the password
				$http({
						method: 'PUT',
						url: "/api/v1/account/password",
						data: { 'password': submittedPassword1 },
						cache: false,
						headers: {
							'Authorization': userSession
						}
				}).success(function(data, status, headers, config) {
					if (data.status == 'ok') {
						alert('Password changed.');
					} else {
						alert("Could not change password:\n" + DisplayErrorMessagesFromAPI(data.messages));
					}
				}).error(function(data, status, headers, config) {
				});
			} else {
				alert(errors.join());
			}
		}
	};
});

tweb.controller('register', function($scope, $http, $location, UserDataFactory, DisplayErrorMessagesFromAPI) {
	
	$scope.user = {
		'firstname': '',
		'lastname': '',
		'email': '',
		'password1': '',
		'password2': ''
	};
	
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
				errors.push('Passwords do not match');
			}

			if (errors.length == 0) {
				$http.post("/api/v1/registerForm", {
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
						alert("Could not register:\n" + DisplayErrorMessagesFromAPI(data.messages));
					}
				}).error(function(data, status, headers, config) {
				});
			} else {
				alert(errors.join());
			}
		}
	};
});

tweb.controller('polldetails', function($scope, $location, $http, UserDataFactory, DisplayErrorMessagesFromAPI) {

	if (UserDataFactory.getSession() == null) {
		alert("Please login first");
		$location.path("login");
	} else {
		var userSession = UserDataFactory.getSession();
		
		var poll = {
			name: '',
			questions: []
		};
		
		var mode = $location.search().mode;
		var editId = (mode == 'edit') ? $location.search().id : null;

		$scope.$on('$viewContentLoaded', function() {
			// As soon as the view loads, we retrieve the poll data from the server
			if (mode == 'edit') {
				$http({
					method: 'GET',
					url: "/api/v1/poll/" + editId,
					cache: false,
					headers: {
						'Authorization': userSession
					}
				})
				.success(function(data, status, headers, config) {
					if (data.status == 'ok') {
						$scope.poll = data.data;
					} else {
						alert("Could not retrieve poll:\n" + DisplayErrorMessagesFromAPI(data.messages));
					}
				}).error(function(data, status, headers, config) {
					alert("Could not retrieve poll: http error");
				});
			} else {
				// This is the poll sample
				$scope.poll = {
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
				};
			}
		});

		// When the user wants to add an answer to the specified question
		$scope.addAnswer = function(pos) {
			$scope.poll.questions[pos].answers.push({
				name: 'New answer'
			});
			
			$scope.$apply();
		}
		
		// When the user wants to remove a question from the poll
		// As usual, doing a delete $scope.poll.questions[pos] will break the bindings. Don't do that.
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
		
		// When the user wnats to remove an answer from a question in the poll
		// As usual, doing a delete $scope.poll.questions[questionPos].answers[answerPos] will break the bindings. Don't do that.
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
		
		// Inserts a new question at the desired position. It contains the sample that will be inserted.
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
		
		// This will either create a new poll or update the one we are editing
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
					errors.push('Question ' + (i + 1) + ': question name is too short');
				} else if (currentQuestionNameLength > 30) {
					errors.push('Question ' + (i + 1) + ': question name is too long');
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
				
				// In case we are editing an existing poll
				if (mode == 'edit') {
					$http({
						method: 'PUT',
						url: "/api/v1/poll/" + $scope.poll._id,
						data: $scope.poll,
						cache: false,
						headers: {
							'Authorization': userSession
						}
					})
					.success(function(data, status, headers, config) {
						if (data.status == 'ok') {
							alert('Poll edited.');
							$location.path("/polls");
						} else {
							alert("Could not edit poll:\n" + data.messages.join());
						}
					}).error(function(data, status, headers, config) {
						alert("Could not edit poll: http error");
					});
				} else {
					// In case we want to create a new poll
					$http({
						method: 'POST',
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
							$location.path("/polls");
						} else {
							alert("Could not create poll:\n" + DisplayErrorMessagesFromAPI(data.messages));
						}
					}).error(function(data, status, headers, config) {
						alert("Could not create poll: http error");
					});
				}
			} else {
				alert(errors.join());
			}
		}
		
		$scope.poll = poll;
	}
});
