var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var common = require(__dirname + '/../common/common.js');

// Mongoose schemas
var User = mongoose.model('User');

module.exports = function (app) {
  app.use('/api/v1', router);
};

// Edit password
router.put('/account/password', function (req, res) {
	
	var authorizationHeader = req.headers['authorization'];
	
	var errors = [];
	var respondCallback = function () { common.respondToUser(res, errors, null); };
	
	if (!req.body.hasOwnProperty("password")) {
		errors.push("Password not supplied");
		respondCallback();
	} else {
		common.checkAndExtractFromSessionToken(authorizationHeader,
										function(userId) {
											
											// The submitted password is checked against the password policy
											var passwordPolicyErrors = common.checkPasswordAgainstPolicy(req.body.password);
			
											for (var i=0;i<passwordPolicyErrors.length;i++) {
												errors.push(passwordPolicyErrors[i]);
											}
											
											if (errors.length == 0) {
												console.log('Updating password for user ' + userId);
												
												// The user's salt is regenerated, for added safety
												common.generateSalt(function(generatedSalt) {
													common.hashPassword(generatedSalt, req.body.password, function(encryptedPassword) {

														// The user is updated in the database
														User.findOneAndUpdate({ '_id': userId }, { 'salt': generatedSalt, 'encrypted_password': encryptedPassword }, function (err, person) {
															if (err) {
																errors.push(common.erro('E_GENERIC_ERROR', "Cannot update database"));
															} else {
																console.log('Password updated');
															}
															
															respondCallback();
														});
													});
												});
											} else {
												respondCallback();
											}
										},
										function() {
											errors.push(common.erro('E_INVALID_SESSION', 'Invalid or no session provided'));
											respondCallback();
										});
	}
});
