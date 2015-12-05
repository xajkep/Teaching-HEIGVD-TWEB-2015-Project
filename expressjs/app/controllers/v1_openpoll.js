var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var globals = require(__dirname + '/../inmemory/globals.js');
var common = require(__dirname + '/../common/common.js');

// Mongoose schemas
var Poll = mongoose.model('Poll');

module.exports = function (app) {
  app.use('/api/v1', router);
};

// Open a poll
router.post('/poll/opened/:id', function (req, res) {
	var pollIdToOpen = req.params.id;
	var authorizationHeader = req.headers['authorization'];
	
	var errors = [];
	var dataRespondToClient = {};
	var respondCallback = function () { common.respondToUser(res, errors, dataRespondToClient); };

	common.checkAndExtractFromSessionToken(authorizationHeader,
									function(userId) {
										// First, check that the requested poll exists
										Poll.findOne({ '_id': pollIdToOpen }, function (err, poll) {
										  if (err || poll == null) {
											  errors.push(common.erro('E_INVALID_IDENTIFIER', 'Poll not found'));
										  } else {
											 // Only the user who created the poll can open it
											 if (common.checkStringTimeConst(poll.created_by, userId)) {
												// The poll can only be opened in the pending state
												if (poll.state == 'pending') {
													
													// This call will set state=opened in the database
													if (!globals.loadPollInMemory(poll, function() {
		
														console.log('Poll is closed. Disconnecting sockets.');
														
														for (var socketId in sio.nsps['/'].adapter.rooms['poll_' + poll._id]){
															var socketInRoom = sio.sockets.connected[socketId];
															
															socketInRoom.disconnect();
														}
	
													})) {
														errors.push(common.erro('E_GENERIC_ERROR', 'Cannot load poll in memory'));
													}

												} else {
													errors.push(common.erro('E_INVALID_STATE', 'The poll is not in pending state'));
												}
											 } else {
												 errors.push(common.erro('E_UNAUTHORIZED', 'You did not create this poll'));
											 }
										  }
										  
										  respondCallback();
										});
									},
									function() {
										errors.push('Invalid or no session provided');
										respondCallback();
									});
});