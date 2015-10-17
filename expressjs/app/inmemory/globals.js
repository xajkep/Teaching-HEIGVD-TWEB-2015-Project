var HashMap = require('hashmap');
var polls = new HashMap();

module.exports = {
	loadPollInMemory: function(poll) {
		console.log('Loading poll in memory: ' + poll._id);
		
		if (polls.has(poll._id)) {
			return false;
		}

		polls.set(poll._id, poll);
		console.log('Poll added in memory');
		
		return true;
	},
	
	userJoinPoll: function(pollId, socketClient) {
		if (!polls.has(pollId)) {
			return false;
		}
		
		var poll = polls.get(pollId);
		
		if (poll.created_by == socketClient.userId) {
			socketClient.join('poll_' + pollId + '_speaker');
			console.log('Added user as speaker');
			
			return 'speaker';
		} else {
			socketClient.join('poll_' + pollId + '_audience');
			console.log('Added user as audience');
			
			return 'audience';
		}
	}
};