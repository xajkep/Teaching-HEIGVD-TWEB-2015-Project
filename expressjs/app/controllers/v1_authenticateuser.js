var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var common = require(__dirname + '/../common/common.js');
var jwt = require('jsonwebtoken');
var validator = require('validator');
var appjs = require(__dirname + '/../../app.js');
var sessionSecret = appjs.sessionSecret;

// Mongoose schemas
var User = mongoose.model('User');

module.exports = function (app) {
  app.use('/api/v1', router);
};

// Authenticate user
router.post('/account', function (req, res) {

	var errors = [];
	var dataToSendToClient = {};

	if (!req.body.hasOwnProperty("email")) {
		errors.push("Email not supplied");
	}
	
	if (!req.body.hasOwnProperty("password")) {
		errors.push("Password not supplied");
	}
	
	var respondCallback = function () { common.respondToUser(res, errors, dataToSendToClient); };

	if (errors.length == 0) {
		// The spcified user must exist
		User.findOne({ 'email': req.body.email }, '_id salt encrypted_password', function (err, userFound) {
			if (userFound == null) {
				errors.push(common.erro('E_INVALID_ACCOUNT', "User not found"));
			} else {
				// The submitted password is hashed using the salt of the specified user
				common.hashPassword(userFound.salt, req.body.password, function(encryptedPasswordComputed) {
					if (common.checkStringTimeConst(encryptedPasswordComputed, userFound.encrypted_password)) {
						
						// Generating a new token for the authenticated user
						var userSessionToken = jwt.sign({ userId: userFound._id }, sessionSecret, {
														   expiresIn: 3600 * 6
														});
						
						dataToSendToClient = { 'session': userSessionToken };
						
						//console.log('User authenticated: ' + req.body.email + " session: " + dataToSendToClient);
					} else {
						errors.push(common.erro('E_BAD_PASSWORD', "Incorrect password"));
					}
				});
			}
			
			respondCallback();
		});
	} else {
		respondCallback();
	}
});
