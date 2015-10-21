var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
  _id: String,
  email: String,
  salt: String,
  encrypted_password: String,
  firstname: String,
  lastname: String
});

var PollSchema = new Schema({
  _id: String,
  state: String,
  created_by: { type: String, ref: 'User' },
  creation_date: Date,
  name: '',
  questions: [ {
				  _id: String,
				  name: String,
				  maxVote: Number,
				  allowAnonymous: Boolean,
				  timeout: Number,
				  answers: [
							   {
								   _id: String,
								   name: String,
								   users: [ { user: { type: String, ref: 'User' }, anonymous: Boolean } ]
							   }
						   ]
				} ]
});

mongoose.model('User', UserSchema);
mongoose.model('Poll', PollSchema);
