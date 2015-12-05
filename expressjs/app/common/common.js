var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var appjs = require(__dirname + '/../../app.js');
var sessionSecret = appjs.sessionSecret;

function erro(error, description) {
	return { 'error': error, 'description': description}
}

module.exports = {
	/*
	This function generates a random hex string made of 20 random bytes
	Once generated, the provided callback is called and received the generated id as parameter
	*/
	generateId: function(callback) {
		crypto.randomBytes(20, function(ex, buf) {
			var generatedId = buf.toString('hex');
			callback(generatedId);
		}); 
	},
	
	
	/*
	This function generates a random hex salt made of 20 random bytes
	Once generated, the provided callback is called and received the generated salt as parameter
	*/
	generateSalt: function(callback) {
		crypto.randomBytes(20, function(ex, buf) {
			var generatedSalt = buf.toString('hex');
			callback(generatedSalt);
		}); 
	},
	
	
	/*
	This function will hash the supplied password. It is salted before being hashed to improve resilience against
	targeted and non targeted brute force attacks.

	salt: String used to salt the password. Must be unique per user in order to be effective.
	clearPassword: password to hash
	callback: Once the password is hashed, the callback function is called and receives the encrypted password as parameter
	*/
	hashPassword: function(salt, clearPassword, callback) {
		var hashPassword = crypto.createHash('sha256').update(clearPassword).digest('hex');
		var encryptedPassword = crypto.createHash('sha256').update(hashPassword + salt).digest('hex');
		callback(encryptedPassword);
	},
	
	
	/*
	This function will check the provided session token

	If it is deemed valid (not expired, genuine and not tampered with), the callbackIfTokenIsValid callback is executed ; the user id is passed as parameter
	In case the token is deemed invalid, the callbackIfTokenIsInvalid callback is called (without parameter)
	*/
	checkAndExtractFromSessionToken: function(token, callbackIfTokenIsValid, callbackIfTokenIsInvalid) {
		jwt.verify(token, sessionSecret, function(err, decoded) {
		  if (err) {
			callbackIfTokenIsInvalid();
		  } else {
			callbackIfTokenIsValid(decoded.userId);
		  }
		});
	},
	
	
	/*
	This function is used to respond to a client, as per the generic answer in the REST documentation

	res: Client to respond to
	errors: Array of error messages (as described in the documentation). If no error is present, must be an empty array.
	data: Specific answer to pass to the user (when there is none, any value is accepted)
	*/
	respondToUser: function(res, errors, data) {
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
	},
	
	
	/*
	Check two string for equality. Constant time to prevent timing attacks.

	Returns true if val1 (String) is equals to val2 (String)
	Otherwise returns false
	*/
	checkStringTimeConst: function(val1, val2) {
		return crypto.createHash('sha256').update(val1).digest('hex') == crypto.createHash('sha256').update(val2).digest('hex');
	},
	
	
	/*
	This function receives two parameters:
	- An error identifier
	- A short explanation of the error

	and returns an error object (as explained in the REST documentation), ready to be put in an array and returned to the client
	*/
	erro: erro,

	
	/*
	This function will check the supplied password.
	It must be conform to all security requirements.

	There requirements are:
	- The length of the password must be at least 8 characters

	Returns an array of error messages. An empty array mean the provided password is conform to the policy.
	*/
	checkPasswordAgainstPolicy: function (password) {
		var errors = [];
		var minPasswordLength = 8;
		
		if (password.length < minPasswordLength) {
			errors.push(erro('E_BAD_PASSWORD', 'Password must be at least ' + minPasswordLength + ' chars in length'));
		}
		
		return errors;
	},
	
	
	/*
	This function will check the poll:
	- all required fields must be present
	- all fields must conform to their constraints (see REST documentation)

	If the supplied form is conform, the cbWhenOK callback is called without parameter
	If there is one or more errors, the cbWhenKO callback is called, and an array of errors is received as parameter
	*/
	checkPoll: function(poll, cbWhenOK, cbWhenKO) {
		var pollName;
		var errors = [];
		var newPollDTO = [];

		if (!poll.hasOwnProperty("name")) {
			errors.push(common.erro('E_INVALID_REQUEST', "Poll name not supplied"));
		} else {
			pollName = poll.name;
			
			if (pollName.length < 3 || pollName.length > 30) {
				errors.push(common.erro('E_INVALID_REQUEST', "Poll name is invalid"));
			}
		}

		if (!poll.hasOwnProperty("questions")) {
			errors.push(common.erro('E_INVALID_REQUEST', "Poll questions not supplied"));
		} else {
			newPollDTO.name = pollName;
			newPollDTO.questions = [];
			
			var questionsCount = poll.questions.length;
			if (questionsCount < 1) {
				errors.push(common.erro('E_INVALID_REQUEST', "At least one question must be specified"));
			} else if (questionsCount > 50) {
				errors.push(common.erro('E_INVALID_REQUEST', "Too many questions specified"));
			} else {
				
				for (var questionIndex = 0; questionIndex < poll.questions.length ; questionIndex++) {
					var currentQuestionDTO = {};
					var currentQuestion = poll.questions[questionIndex];
					
					if (!currentQuestion.hasOwnProperty("name")) {
						errors.push(common.erro('E_INVALID_REQUEST', "Question has no name"));
						break;
					}

					if (!currentQuestion.hasOwnProperty("allowAnonymous")) {
						errors.push(common.erro('E_INVALID_REQUEST', "Question has no allowAnonymous"));
						break;
					}
					
					if (!currentQuestion.hasOwnProperty("maxVote")) {
						errors.push(common.erro('E_INVALID_REQUEST', "Question has no maxVote"));
						break;
					}
					
					if (!currentQuestion.hasOwnProperty("answers")) {
						errors.push(common.erro('E_INVALID_REQUEST', "Question has no answers"));
						break;
					}
					
					if (!currentQuestion.hasOwnProperty("timeout")) {
						errors.push(common.erro('E_INVALID_REQUEST', "Question has no timeout"));
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
						errors.push(common.erro('E_INVALID_REQUEST', "Question name is invalid"));
					}
					
					if (currentQuestionDTO.allowAnonymous !== true && currentQuestionDTO.allowAnonymous !== false) {
						errors.push(common.erro('E_INVALID_REQUEST', "AllowAnonymous is invalid"));
					}
					
					if (currentQuestionDTO.maxVote < 1 || currentQuestionDTO.maxVote > 10) {
						errors.push(common.erro('E_INVALID_REQUEST', "MaxVote is invalid"));
					}
					
					if (currentQuestionDTO.timeout < 15 || currentQuestionDTO.timeout > 600) {
						errors.push(common.erro('E_INVALID_REQUEST', "Timeout is invalid"));
					}
					
					var answersCount = currentQuestionAnswers.length;
					if (answersCount < 2) {
						errors.push(common.erro('E_INVALID_REQUEST', "At least two answers must be specified"));
					} else if (answersCount > 10) {
						errors.push(common.erro('E_INVALID_REQUEST', "Too many answers specified"));
					} else {
						console.log("  Answers:");
						
						for (var answerIndex = 0; answerIndex < currentQuestionAnswers.length ; answerIndex++) {
							var currentAnswerDTO = {};
							var currentAnswer = currentQuestionAnswers[answerIndex];
							
							if (!currentQuestion.hasOwnProperty("name")) {
								errors.push(common.erro('E_INVALID_REQUEST', "Answer has no name"));
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
			
			//console.log("newPollDTO: %j", newPollDTO);
		}
		
		if (errors.length != 0) {
			cbWhenKO(errors);
		} else {
			cbWhenOK(newPollDTO);
		}
	}
};
