
* Every message and response is encoded in UTF-8.
* Each call (except login) must have the Authorization HTTP HEADER set with the user session (returned by the login request)
* Port: 1337
* BASE: /api/v1

## General request (if connected)

Note: set the Authorization header with your session id

## General response

~~~json
{
  'status': ('ok'|'ko'),
  'messages': [String],
  'data': {}
}
~~~

## Requests

### Register

PUT data

route: BASE/account

~~~json
{
  'email': String,
  'firstname': String,
  'lastname': String,
  'password': String
}
~~~

### Login

POST data

route: BASE/account

~~~json
{
  'email': String,
  'password': String
}
~~~

response, in case of success:
~~~json
{
  'status': 'ok',
  'data': {session: <session>}
}
~~~


response, in case of failure:
~~~json
{
  'status': 'ko',
  'messages': <errors>,
  'data': null}
}
~~~

### Logout

POST data

route: BASE/account

### Edit password

POST data

route: BASE/account/password

~~~json
{
  'password': String
}
~~~

### Create a new poll

PUT request

route: BASE/poll

~~~json
{
  'name': String,
  'questions': [{
    'name': String,
    'allowAnonymous': Boolean,
    'maxVote' : Integer,
    'answers' : [{
        'name'
      }]
    }]
}
~~~

### Delete an existing poll

DELETE request

route: BASE/poll/$id

### Open a poll

POST data
route: BASE/poll/opened/$id

### Join poll

POST data
route: BASE/poll/join/$id

### View poll

GET request

route: BASE/poll/$id

response:
~~~json
{
  '_id': String,
  'name': String,
  'questions': [{
      '_id': String,
      'name': String,
      'allowAnonymous': Boolean,
      'maxVote': Integer,
      'answers': [{
	    '_id': String,
        'name': String
      }]
    }]
}
~~~

questions is an array which contains all of the questions in the requested poll
for each question, there a multiple possible answers. These are represented in the
answers array.

Hereafter is an example :

~~~json
{
  '_id': '1234567879',
  'name': 'First course',
  'questions': [{
      '_id': '1234567879-0',
      'name': 'How are you today?',
      'allowAnonymous': true,
      'maxVote' : 1,
      'answers' : [
					{
					  '_id': '1234567879-0-0',
					  name: 'Motivated'
					},
					{
					  '_id': '1234567879-0-1',
					  name: 'Depressed'
					},
					{
					  '_id': '1234567879-0-2',
					  name: 'Lucky'
					},
					{
					  '_id': '1234567879-0-3',
					  name: 'OK I guess'
					}
				  ]
    },
    {
      '_id': '1234567879-1',
      'name': 'Do you have a pet?',
      'allowAnonymous': true,
      'maxVote' : 1,
      'answers' : [
					{
					  '_id': '1234567879-1-0',
					  name: 'Yes'
					},
					{
					  '_id': '1234567879-1-1',
					  name: 'No'
					}
				  ]
}
~~~

### View completed poll

GET request

route: BASE/poll/$id

response:
~~~json
{
  '_id': String,
  'name': String,
  'questions': [{
      '_id': String,
      'name': String,
      'allowAnonymous': Boolean,
      'maxVote' : Integer,
      'answers' : [{
	    '_id': String,
        'name' : String,
        'voted' : [{
		    '_id': String,
            'firstname' : String,
            'lastname' : String
          }]
      }]
    }]
}
~~~

Example:

~~~json
{
  '_id': '1234567879',
  'name': 'First course',
  'questions': [{
      '_id': '1234567879-0',
      'name': 'How are you today?',
      'allowAnonymous': true,
      'maxVote' : 1,
      'answers' : [
					{
					  '_id': '1234567879-0-0',
					  name: 'Motivated',
					  voted: [ {
					             '_id': '87216',
								 'firstname': 'Paul',
								 'lastname': 'Tikken'
					           },
							   {
					             '_id': '32991',
								 'firstname': 'Luc',
								 'lastname': 'Durand'
					           }]
					},
					{
					  '_id': '1234567879-0-1',
					  name: 'Depressed',
					  voted: []
					},
					{
					  '_id': '1234567879-0-2',
					  name: 'Lucky',
					  voted: [ {
					             '_id': '1355',
								 'firstname': 'Laura',
								 'lastname': 'Swagger'
					           }]
					},
					{
					  '_id': '1234567879-0-3',
					  name: 'OK I guess',
					  voted: []
					}
				  ]
    },
    {
      '_id': '1234567879-1',
      'name': 'Do you have a pet?',
      'allowAnonymous': true,
      'maxVote' : 1,
      'answers' : [
					{
					  '_id': '1234567879-1-0',
					  name: 'Yes',
					  voted: [ {
					             '_id': '87216',
								 'firstname': 'Paul',
								 'lastname': 'Tikken'
					           },
							   {
					             '_id': '32991',
								 'firstname': 'Luc',
								 'lastname': 'Durand'
					           }]
					},
					{
					  '_id': '1234567879-1-1',
					  name: 'No',
					  voted: []
					}
				  ]
}
~~~

### View my polls

GET request

route: BASE/polls

response:
~~~json
{
  '_id': String,
  'name': String,
  'creation_date': Date,
  'state': String
}
~~~

## Patterns

SHORTNAME = "[a-zA-Z]{1}[a-zA-Z0-9 -_]{2,60}" // firstname, lastname, poll.name

LONGNAME = "[a-zA-Z]{1}[a-zA-Z0-9 -_.!?]{2,255}" // question.name, answer.name

ID = "[0-9]{1,}"

## Errors

E_WRONG_PWD = "Wrong password"

E_REQUIRED = "Please complete required inputs"

E_EMAIL = "This email is not valid"

E_NAME = "This name is not valid"

E_ID = "This id don't exist"

E_POLL_CLOSED = "This poll is closed"

E_POLL_CREATE = "Bad format receive"

## Success

S_LOGIN = "Welcome to you human"

S_LOGOUT = "You have been disconnected successfully"

S_CHANGE_PASSWORD = "Password changed"

S_POLL_CREATED = "Your poll has been created successfully"

S_POLL_DELETED = "Your poll has been deleted successfully"

S_POLL_RUNNING = "Your poll is now open"

S_POLL_JOINED = "Poll joined"

S_QUESTION_ANSWERED = "Answered"
