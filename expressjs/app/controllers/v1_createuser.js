var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var common = require(__dirname + '/../common/common.js');
var validator = require('validator');

// Mongoose schemas
var User = mongoose.model('User');

module.exports = function (app) {
  app.use('/api/v1', router);
};

// New user account
router.post('/registerForm', function (req, res) {
	var errors = [];
	
	// Checking that all required attributes have been submitted

	if (!req.body.hasOwnProperty("email")) {
		errors.push(common.erro("E_INVALID_REQUEST", "Email not supplied"));
	} else {
		var emailLen = req.body.email.length;
		if (emailLen < 5 || emailLen > 70) {
			errors.push(common.erro("E_INVALID_REQUEST", "Email length is invalid"));
		} else {
			if (!validator.isEmail(req.body.email)) {
				errors.push(common.erro("E_INVALID_REQUEST", "Invalid email format"));
			}
		}
	}
	
	if (!req.body.hasOwnProperty("firstname")) {
		errors.push(common.erro("E_INVALID_REQUEST", "Firstname not supplied"));
	} else {
		var firstNameLen = req.body.firstname.length;
		if (firstNameLen < 2 || firstNameLen > 70) {
			errors.push(common.erro("E_INVALID_REQUEST", "Firstname length is invalid"));
		}
	}
	
	if (!req.body.hasOwnProperty("lastname")) {
		errors.push(common.erro("E_INVALID_REQUEST", "Lastname not supplied"));
	} else {
		var firstNameLen = req.body.lastname.length;
		if (firstNameLen < 2 || firstNameLen > 70) {
			errors.push(common.erro("E_INVALID_REQUEST", "Lastname length is invalid"));
		}
	}

	// Checking the password against the security policy
	if (!req.body.hasOwnProperty("password")) {
		errors.push(common.erro("E_INVALID_REQUEST", "Password not supplied"));
	} else {
		var passwordPolicyErrors = common.checkPasswordAgainstPolicy(req.body.password);
		
		for (var i=0;i<passwordPolicyErrors.length;i++) {
			errors.push(passwordPolicyErrors[i]);
		}
	}

	if (errors.length == 0) {
		// We check that the email address is not already in the database
		User.findOne({ email: { $regex : new RegExp(req.body.email, "i") } }, function (err, user){
		  if (user != null) {
			  // Email already registered
			  errors.push(common.erro("E_EMAIL_ALREADY_REGISTERED", "Email already registered"));
			  common.respondToUser(res, errors, null);
		  } else {
			// If the email is not in the database, an identifier is generated, which will uniquely identify our new user
			common.generateId(function(generatedId) {
				// A salt is generated as well. This is used to hash the user's password
				common.generateSalt(function(generatedSalt) {
					// Password is then hashed
					common.hashPassword(generatedSalt, req.body.password, function(encryptedPassword) {
						var newUser = new User({ _id: generatedId,
												 email: req.body.email,
												 salt: generatedSalt,
												 encrypted_password: encryptedPassword,
												 firstname: req.body.firstname,
												 lastname: req.body.lastname,
												 participation_polls: []} );
						
						// Our new user is then inserted in the database						
						newUser.save(function (err, newUser) {
							if (err) {
								errors.push(common.erro("E_GENERIC_ERROR", "Cannot insert into database"));
								console.error(err);
							} else {
								console.log('User added ' + newUser);
							}

							common.respondToUser(res, errors, null);
						});
					});
				});
			}); 
		  }
		});
	} else {
		common.respondToUser(res, errors, null);
	}
});