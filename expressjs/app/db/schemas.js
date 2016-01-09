var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// A user has:
// a unique id
// a unique email
// a salt (assigned when created and every time the user changes his password)
// an encrypted password (see documentation)
// a firstname
// a lastname
var UserSchema = new Schema({
  _id: String,
  email: String,
  salt: String,
  encrypted_password: String,
  firstname: String,
  lastname: String,
  participation_polls: [{ type: String, ref: 'Poll' }]
});

// A poll has:
// a unique id
// a state (opened, closed, completed)
// a creator (reference to a user)
// a creation date
// a name
// a list of questions, each question has a name, a max number of votes, a bit indicating if anonymous voting is allowed, a timeout and a list of users who voted on each answer
var PollSchema = new Schema({
  _id: String,
  state: String,
  created_by: { type: String, ref: 'User' },
  creation_date: Date,
  name: '',
  questions: [ {
				  _id: String,
				  name: String,
				  // Maximum number of times a single user can vote on the question (=sum of his votes on all answers)
				  maxVote: Number,
				  allowAnonymous: Boolean,
				  // Allowed duration of voting on this question. In seconds.
				  timeout: Number,
				  answers: [
							   {
								   _id: String,
								   // Name of the answer. For example: Yes
								   name: String,
								   // A user vote is composed of: a reference to the user who voted, a flag: anonymous or not, and the delta(vote received - start of question) in milliseconds
								   users: [ { user: { type: String, ref: 'User' }, anonymous: Boolean, timing: Number } ]
							   }
						   ]
				} ]
});

mongoose.model('User', UserSchema);
mongoose.model('Poll', PollSchema);
