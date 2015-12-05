
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