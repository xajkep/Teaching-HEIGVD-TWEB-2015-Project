var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var common = require(__dirname + '/../common/common.js');

// Mongoose schemas
var Poll = mongoose.model('Poll');

module.exports = function (app) {
  app.use('/api/v1', router);
};

// Delete a poll
router.delete('/poll/:id', function (req, res) {
	
	// The poll to delete is a parameter
	var pollIdToDelete = req.params.id;
	
	var authorizationHeader = req.headers['authorization'];
	
	var errors = [];
	var newPollDTO = {};
	var respondCallback = function () { common.respondToUser(res, errors, {}); };
	
	common.checkAndExtractFromSessionToken(authorizationHeader,
									function(userId) {
										Poll.findOne({ _id: pollIdToDelete }, 'state created_by', function (err, poll){
										  if (poll == null) {
											  errors.push(common.erro('E_INVALID_IDENTIFIER', 'Poll not found'));
											  respondCallback();
										  } else {
											 // Only the owner of a poll can delete it
											 if (common.checkStringTimeConst(poll.created_by, userId)) {

												// If the poll is currently opened, it must be closed by either:
												// - finishing it by responding to all of its questions
												// - wait for the hard timeout, which will close it automatically
												if (poll.state == 'opened') {
													errors.push(common.erro('E_INVALID_STATE', 'The poll is currently opened'));
													respondCallback();
												} else {
													// Removing the poll
													Poll.remove({ _id: pollIdToDelete }, function(err) {
														
														if (err) {
															errors.push(common.erro('E_GENERIC_ERROR', 'Cannot delete poll'));
														}
														
														respondCallback();
													});
												}
											 } else {
												errors.push(common.erro('E_UNAUTHORIZED', 'You did not create this poll'));
												respondCallback();
											 }
										  }
										});
									},
									function() {
										errors.push(common.erro('E_INVALID_SESSION', 'Invalid or no session provided'));
										respondCallback();
									});
});
