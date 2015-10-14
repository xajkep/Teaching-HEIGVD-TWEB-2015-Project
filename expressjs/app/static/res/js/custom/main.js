var tweb = angular.module('tweb', ['ngRoute', 'ngAnimate']);

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
                otherwise({
                    redirectTo: '/login'
                });
        }]);

tweb.controller('home', function($scope) {
	$scope.message = 'Page: home';
});

tweb.controller('login', function($scope, $http, $location, UserDataFactory) {
	$scope.login = function() {

		var submittedEmail = $scope.user.email;
		var submittedPassword = $scope.user.password;

		$http.post("/testmongoose/account", {
			email: submittedEmail,
			password: submittedPassword
		})
		.success(function(data, status, headers, config) {
			if (data.status == 'ok') {
				
				UserDataFactory.setSession(data.data);
				alert('Logged in. Redirecting');
				$location.path("/polls");
			} else {
				alert("Could not login: " + data.messages.join());
			}
		}).error(function(data, status, headers, config) {
			$scope.msg2 = data;
		});
	};
});

tweb.controller('polls', function($scope, UserDataFactory) {
	$scope.userSession = UserDataFactory.getSession();
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
			
			$http.put("/testmongoose/register", {
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
					url: "/testmongoose/poll",
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
				});
			} else {
				alert(errors.join());
			}
		}
		
		$scope.poll = poll;
	}
});
