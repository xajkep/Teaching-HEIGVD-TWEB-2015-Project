* Every message and response is encoded in UTF-8.
* Each call (except login) must have the Authorization HTTP HEADER set with the user session (returned by the login request)
* Port: 1337
* BASE: /api/v1

## General request (if connected)

Note: set the Authorization header with your session

## General response

~~~json
{
  'status': ('ok'|'ko'),
  'messages': [String],
  'data': {}
}
~~~

status: _ko_ when one or more errors occured (see _messages_ for more details) or _ok_ when the request is successful.

data: when data is expected, this attribute is populated occordingly.


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

_password_ must be at least 8 characters in length.

Example:

~~~json
{
	'email': 'jean.dupont@mail.com',
	'firstname': 'Jean',
	'lastname': 'Dupont',
	'password': 'myPassword123'
}
~~~

Response:

~~~json
{
	'status':'ok',
	'messages':[],
	'data':null
}
~~~

Errors:
E_INVALID_REQUEST : In case of missing attributes
E_BAD_PASSWORD : The password is too weak

### Login

POST data

route: BASE/account

~~~json
{
  'email': String,
  'password': String
}
~~~

Response:
~~~json
{
  'status': 'ok',
  'data': {session: <session>}
}
~~~

_<session>_ is the authentication token you must include in every subsequent request.

Response, in case of failure:
~~~json
{
  'status': 'ko',
  'messages': <errors>,
  'data': null}
}
~~~

Errors:
E_INVALID_REQUEST : In case of missing attributes
E_INVALID_ACCOUNT : The email is incoreect
E_BAD_PASSWORD : The password is incorrect

### View stats

GET data

route: BASE/stats

~~~json
{
  'usersCount': Number,
  'pollsCount': Number,
  'openPollsCount': Number
}
~~~

Returns basic information about the app.

* usersCount: Number of users
* pollsCount: Number of polls created by our users
* openPollsCount: Number of currently opened polls

Example:
~~~json
{
  'usersCount': 2,
  'pollsCount': 1,
  'openPollsCount': 1
}
~~~

### Edit password

POST data

route: BASE/account/password

~~~json
{
  'password': String
}
~~~

_password_ must be at least 8 characters in length.

Errors:
E_BAD_PASSWORD : The password is too weak

### Create a new poll

PUT request

route: BASE/poll

~~~json
{
  'name': String,
  'questions': [{
    'name': String,
    'allowAnonymous': Boolean,
    'maxVote': Integer,
    'timeout': Integer,
    'answers': [{
        'name'
      }]
    }]
}
~~~

name: Must be between 3 and 30 characters in length
questions: Is an array of questions. At least one must be provided.

For each question:
	name: This is the question that will be displayed. Must be between 5 ans 30 characters is length.
	allowAnonymous: When set to _true_, your audience and yourself will not be able to see who voted. When anonymous vote is allowed, exepect less details in the poll report.
	maxVote: Maximum number of votes each person can cast. Must be between 1 and 10.
	timeout: Number of seconds during which the question will be shown. Once expired, voting on the question is no more allowed.
	answers : array of possible answers for this question

	For each answer:
	name: Name of the displayed vote option

Once created, the poll is in pending state. You are then free to open it.

Example:

~~~json
{
	'name': 'SuperPOLL',
	'questions': [
	               {'name': 'How is the weather today?',
				    'allowAnonymous': false,
					'maxVote': 5,
					'timeout': 30,
					'answers': [
					             {'name': 'Good'},
								 {'name': 'Not bad'},
								 {'name': 'Excellent'},
								 {'name': 'Could be better'}
							    ]
					},

					{'name': 'Yes or no?',
					 'allowAnonymous': false,
					 'maxVote': 5,
					 'timeout': 30,
					 'answers': [
					             {'name': 'Yes'},
								 {'name': 'No'}
								]
					}
				  ]
}
~~~

Errors:
E_INVALID_REQUEST : In case of missing attributes
E_AT_LEAST_ONE_QUESTION : There must be at least one question
E_AT_LEAST_TWO_ANSWERS : For each question, there must be at least two answers


### Edit an existing poll

PUT request

route: BASE/poll

~~~json
{
  _id: String,
  'name': String,
  'questions': [{
    'name': String,
    'allowAnonymous': Boolean,
    'maxVote': Integer,
    'timeout': Integer,
    'answers': [{
        'name'
      }]
    }]
}
~~~

The \_id attribute identifies the poll to be modified.

### Delete an existing poll

DELETE request

route: BASE/poll/$id

### Open a poll

POST data
route: BASE/poll/opened/$id

Opening a poll is the process of accepting new clients who will be able to vote.
A poll can only be opened when it is in the pending state, and only once.

Once opened, a poll can be joined using a socket.io client. Refer to the socket.io section.
A poll is automatically closed 6 hours after it is opened. In that case, it will be assigned the closed state.

In normal circumstances, when the poll is successfully completed, it will be assigned the completed state.

Errors:
E_UNAUTHORIZED: You can only open a poll you have created
E_INVALID_IDENTIFIER: The specified poll does not exist
E_CANNOT_OPEN: This poll is either completed, already opened or has expired.

### View poll

GET request

route: BASE/poll/$id

When the poll is pending, the following response is provided:

~~~json
{
  '_id': String,
  'name': String,
  'questions': [{
      '_id': String,
      'name': String,
      'allowAnonymous': Boolean,
      'maxVote': Integer,
      'timeout': Integer,
      'answers': [{
	    '_id': String,
        'name': String
      }]
    }]
}
~~~

When the poll is completed, the following response is provided:
~~~json
{
  '_id': String,
  'name': String,
  'questions': [{
      '_id': String,
      'name': String,
      'allowAnonymous': Boolean,
      'maxVote': Integer,
      'timeout': Integer,
      'answers': [{
	    '_id': String,
        'name': String
		'users': [ {
		              'anonymous': Boolean,
					  'user': {
					             '_id': String,
								 'email': String,
								 'firstname': String,
								 'lastname': String
					   }
					}]
      }]
    }]
}
~~~

Note: when questions.answers.users.anonymous is set to True, the questions.answers.users.user attribute is not included.

Example:

~~~json
{
  'status':'ok',
  'messages':[

  ],
  'data':{
    '_id':'5a39987657e8f45eea39fa32e3b5a85d120eeb8b',
    'state':'completed',
    'created_by':'d221b823f0ec6671b85e56d911c8f305735a5f01',
    'creation_date':'2015-10-21T20:28:49.226Z',
    'name':'SuperPOLL',
    '__v':0,
    'questions':[
      {
        '_id':'5a39987657e8f45eea39fa32e3b5a85d120eeb8b-0',
        'name':'How is the weather today?',
        'maxVote':5,
        'allowAnonymous':false,
        'timeout':30,
        'answers':[
          {
            'name':'Good',
            '_id':'5a39987657e8f45eea39fa32e3b5a85d120eeb8b-0-0',
            'users':[
              {
                'anonymous':false,
                'user':{
                  '_id':'86b96d75f851c982204c8707fb62248996462581',
                  'email':'test@test.com2',
                  'firstname':'Bon',
                  'lastname':'Bon'
                }
              },
              {
                'anonymous':false,
                'user':{
                  '_id':'50760a3f94ff03361a3948c46a13b33fbd9570d2',
                  'email':'test@test.com3',
                  'firstname':'test@test.com3',
                  'lastname':'test@test.com3'
                }
              }
            ]
          },
          {
            'name':'Not bad',
            '_id':'5a39987657e8f45eea39fa32e3b5a85d120eeb8b-0-1',
            'users':[

            ]
          },
          {
            'name':'Excellent',
            '_id':'5a39987657e8f45eea39fa32e3b5a85d120eeb8b-0-2',
            'users':[
              {
                'anonymous':false,
                'user':{
                  '_id':'50760a3f94ff03361a3948c46a13b33fbd9570d2',
                  'email':'test@test.com3',
                  'firstname':'test@test.com3',
                  'lastname':'test@test.com3'
                }
              }
            ]
          },
          {
            'name':'Could be better',
            '_id':'5a39987657e8f45eea39fa32e3b5a85d120eeb8b-0-3',
            'users':[
              {
                'anonymous':false,
                'user':{
                  '_id':'86b96d75f851c982204c8707fb62248996462581',
                  'email':'test@test.com2',
                  'firstname':'Bon',
                  'lastname':'Bon'
                }
              },
              {
                'anonymous':false,
                'user':{
                  '_id':'50760a3f94ff03361a3948c46a13b33fbd9570d2',
                  'email':'test@test.com3',
                  'firstname':'test@test.com3',
                  'lastname':'test@test.com3'
                }
              }
            ]
          }
        ]
      },
      {
        '_id':'5a39987657e8f45eea39fa32e3b5a85d120eeb8b-1',
        'name':'Yes or no?',
        'maxVote':5,
        'allowAnonymous':false,
        'timeout':30,
        'answers':[
          {
            'name':'Yes',
            '_id':'5a39987657e8f45eea39fa32e3b5a85d120eeb8b-1-0',
            'users':[
              {
                'anonymous':false,
                'user':{
                  '_id':'50760a3f94ff03361a3948c46a13b33fbd9570d2',
                  'email':'test@test.com3',
                  'firstname':'test@test.com3',
                  'lastname':'test@test.com3'
                }
              },
              {
                'anonymous':false,
                'user':{
                  '_id':'86b96d75f851c982204c8707fb62248996462581',
                  'email':'test@test.com2',
                  'firstname':'Bon',
                  'lastname':'Bon'
                }
              },
              {
                'anonymous':false,
                'user':{
                  '_id':'86b96d75f851c982204c8707fb62248996462581',
                  'email':'test@test.com2',
                  'firstname':'Bon',
                  'lastname':'Bon'
                }
              },
              {
                'anonymous':false,
                'user':{
                  '_id':'86b96d75f851c982204c8707fb62248996462581',
                  'email':'test@test.com2',
                  'firstname':'Bon',
                  'lastname':'Bon'
                }
              },
              {
                'anonymous':false,
                'user':{
                  '_id':'86b96d75f851c982204c8707fb62248996462581',
                  'email':'test@test.com2',
                  'firstname':'Bon',
                  'lastname':'Bon'
                }
              },
              {
                'anonymous':false,
                'user':{
                  '_id':'86b96d75f851c982204c8707fb62248996462581',
                  'email':'test@test.com2',
                  'firstname':'Bon',
                  'lastname':'Bon'
                }
              },
              {
                'anonymous':false,
                'user':{
                  '_id':'50760a3f94ff03361a3948c46a13b33fbd9570d2',
                  'email':'test@test.com3',
                  'firstname':'test@test.com3',
                  'lastname':'test@test.com3'
                }
              }
            ]
          },
          {
            'name':'No',
            '_id':'5a39987657e8f45eea39fa32e3b5a85d120eeb8b-1-1',
            'users':[
              {
                'anonymous':false,
                'user':{
                  '_id':'50760a3f94ff03361a3948c46a13b33fbd9570d2',
                  'email':'test@test.com3',
                  'firstname':'test@test.com3',
                  'lastname':'test@test.com3'
                }
              },
              {
                'anonymous':false,
                'user':{
                  '_id':'50760a3f94ff03361a3948c46a13b33fbd9570d2',
                  'email':'test@test.com3',
                  'firstname':'test@test.com3',
                  'lastname':'test@test.com3'
                }
              }
            ]
          }
        ]
      },
      {
        '_id':'5a39987657e8f45eea39fa32e3b5a85d120eeb8b-2',
        'name':'What do you prefer?',
        'maxVote':1,
        'allowAnonymous':true,
        'timeout':30,
        'answers':[
          {
            'name':'Yellow',
            '_id':'5a39987657e8f45eea39fa32e3b5a85d120eeb8b-2-0',
            'users':[
              {
                'anonymous':true
              }
            ]
          },
          {
            'name':'Orange',
            '_id':'5a39987657e8f45eea39fa32e3b5a85d120eeb8b-2-1',
            'users':[
              {
                'anonymous':false,
                'user':{
                  '_id':'86b96d75f851c982204c8707fb62248996462581',
                  'email':'test@test.com2',
                  'firstname':'Bon',
                  'lastname':'Bon'
                }
              }
            ]
          }
        ]
      }
    ]
  }
}
~~~

### List my polls

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

Example:

~~~json
{
  'status': 'ok',
  'messages': [],
  'data': [
			{
			  '_id': '5a39987657e8f45eea39fa32e3b5a85d120eeb8b',
			  'state': 'completed',
			  'creation_date': '2015-10-21T20:28:49.226Z',
			  'name': 'Poll A'
			},
			{
			  '_id': 'e3dd2ecd0edcb753513fff2601b4f5f73dafdd32',
			  'state': 'pending',
			  'creation_date': '2015-10-22T10:55:25.790Z',
			  'name': 'Poll B'
			}
		  ]
}
~~~

# Socket.io

Socket.io is used once a poll is opened and until it is closed or completed. You will use it to :

* Cast your vote
* Receive live results
* Be notified of the next question

The endpoint is the same server as the Web server, port 8090. Encoding it UTF-8.
One connected, start by sending the authAndJoin message.

## Server => client messages

### userDisconnect
Issued to the speaker when a previously connected user has disconnected

Payload: String - the user id

### userConnect
Issued to the speaker when a used joined the poll

Payload:
~~~json
{
  '_id': String,
  'firstName': String,
  'lastName': String,
  'email': String,
  'voted': Boolean,
}
~~~
voted: Is always null when the current question allows anonymous voting. Otherwise indicates if the user already casted at least one vote on the current question.


### audienceList
Issued to the speaker just after reception of the catchUp message.
This message contains a list of all people connected to the poll.

Payload: Array
~~~json
[
	{
	  '_id': String,
	  'firstName': String,
	  'lastName': String,
	  'email': String,
	  'voted': Boolean,
	}
]
~~~

voted: Is always null when the current question allows anonymous voting. Otherwise indicates if the user already casted at least one vote on the current question.

Example:

~~~json
[
	{
	  '_id': 5a39987657e8f45eea39fa32e3b5a85d120eeb89,
	  'firstName': 'Paul',
	  'lastName': 'Dupont',
	  'email': 'paul.dupont@mail.com',
	  'voted': false
	},
	{
	  '_id': 5a39987657e8f45eea39fa32e3b5a85d120eeb81,
	  'firstName': 'Sophie',
	  'lastName': 'Perette',
	  'email': 'sophie.perette@mail.com',
	  'voted': true
	},
]
~~~

### nextQuestion
Issued to the speaker and the audience at the request of the speaker or when someone reconnects to the poll

~~~json
{
	'timeout': Number,
	'question': {
      '_id': String,
      'name': String,
      'allowAnonymous': Boolean,
      'maxVote': Integer,
      'timeout': Integer,
      'answers': [{
	    '_id': String,
        'name': String
      }]
    }
	'voted': Number,
	'current': Number,
	'total': Number,

}
~~~

timeout is in most cases the question timeout (in seconds). However, if you join a poll during the voting period, this value will be lower ; in that case the voted field will contain the number of votes you already casted on this question.
You must only allow voting for this specified amount of time once the message is received.

current denotes the position of the question in the poll (1=first question)
total is the number of questions in the poll


### goNextQuestionResult
Issued in response to the goNextQuestion message.

This message is only sent in case of error.

~~~json
{
	'status': String,
	'messages': [],
}
~~~

ERRORS:
E_UNAUTHORIZED: Only a speaker can issue the goNextQuestion message


### liveVoteResults
Issued to the speaker when someone sends a vote or when the speaker reconnects to the poll.

~~~json
{
	'results': [
				{
				  count: 5
				},
				{
				  count: 7
				},
			   ],
	'whovoted': String
}
~~~

results: contains for each answer the number of votes casted. In the example above 5 votes were casted for the first answer, and 7 for the second answer.
whovoted is null when catching up or when the question allows anonymous voting and the person who just voted did choose to vote anonymously. When not null, it contains the id of the person who voted.


### authAndJoinResult
Issued in response to the authAndJoin message.

The server will choose to make you join the poll as speaker (if you are the poll's owner) or as audience (otherwise).

Once you receive this message, you should create your event listeners and then, when ready, send the catchUp message.

Example, when joining as speaker:
~~~json
{
  'status': 'ok',
  'data': 'speaker'
}
~~~

Example, when joining as audience:
~~~json
{
  'status': 'ok',
  'data': 'audience'
}
~~~

Example, in case of error:
~~~json
{
  'status': 'ko',
  'messages': ['E_UNAUTHORIZED']
}
~~~

Errors:
E_UNAUTHORIZED: You are not allowed to join this poll
E_INVALID_IDENTIFIER: The specified poll does not exist
E_NOT_OPENED: The specified poll is not open


### pollCompleted
Issued when the poll is completed.

No payload.

### votingOnThisQuestionEnded
Issued when the timeout of the current question reached 0. The server will not accept voting on this queston anymore.

No payload.

## Client => server messages

## catchUp
This message is issued after a successful authAndJoin
It tells the server that you are ready to receive asynchronous messages.

Once sent, the server will immediately send you these messages, so you can catch up:
* audienceList (only if you are a speaker)
* liveVoteResults (only if you are a speaker)
* nextQuestion (only if a question is displayed)

When the server receives this message, it will issue a userConnect to the speakers.

No payload.

## goNextQuestion
This message is sent to go to the next question in the poll.

This will result in either:
* a nextQuestion message, if the current question is not the last question in the poll.
* a pollCompleted message, if the current question is the last question in the poll.

No payload.

## vote
This message is used to cast a vote.

~~~json
{
  'answerIndex': Number,
  'voteAsAnonymous': Boolean
}
~~~

answerIndex: the index of the question to cast a vote for.
voteAsAnonymous: true will keep your vote private (if the question allows anonymous voting only) - your name will not be displayed. Specify any value when the current question does not accept anonymous voting.

If this vote is accepted, a liveVoteResults message is then issued to the speakers.

Response when the vote is registered:
~~~json
{
	'status': 'ok'
}
~~~

Response in case of error:
~~~json
{
	'status': 'ko',
	'messages': ['E_UNAUTHORIZED']
}
~~~

Errors:
E_UNAUTHORIZED : You are not authorized
E_INVALID_REQUEST : Generic error. Either you casted your maximum number of votes, or the poll is not open anymore.
