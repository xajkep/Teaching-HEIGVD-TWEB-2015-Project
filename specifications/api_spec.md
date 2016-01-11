## REST API documentation - v1

This documentation is updated for each version of the API.

* Every message and response is encoded in UTF-8.
* Requests and responses are in JSON format.
* Each call (except login) must have the Authorization HTTP HEADER set with the user session (returned by the login request) : Header: SESSION_ID_HERE
* Port: same as the Web server (8080)
* BASE: /api/v1

## General request (if connected)

Note: set the Authorization header with your session

## General response

~~~json
{
  "status": ("ok"|"ko"),
  "messages": [ "error": String,
                 "description": String }
			  ],
  "data": {}
}
~~~

status: _ko_ when one or more errors occured (see _messages_ for more details) or _ok_ when the request is successful.<br />
messages: array of error messages, empty when there is no error. _error_ specifies the error identifier (documented in each method) and _description_ contains a short explanation of the error<br />
data: when data is expected, this attribute is populated occordingly. Has no meaning when an error is returned.


## Requests

### Register

POST data

route: BASE/registerForm

~~~json
{
  "email": String,
  "firstname": String,
  "lastname": String,
  "password": String
}
~~~

_password_ must be at least 8 characters in length.
_email_ must be between 5 and 70 characters in length.
_firstname_ and _lastname_ must be between 2 and 70 characters in length.

Example:

~~~json
{
	"email": "jean.dupont@mail.com",
	"firstname": "Jean",
	"lastname": "Dupont",
	"password": "myPassword123"
}
~~~

Response:

~~~json
{
	"status":"ok",
	"messages":[],
	"data":null
}
~~~


Errors:<br />
E_EMAIL_ALREADY_REGISTERED : The supplied email address is already registered<br />
E_INVALID_REQUEST : In case of missing attributes<br />
E_BAD_PASSWORD : The password is too weak<br />
E_GENERIC_ERROR : An internal error as occured

### Login

POST data

route: BASE/account

Once single user cannot join the same poll more than once at the same time.<br />
If this occurs, its others sessions previously connected to this same pool he is trying to join will be issued a duplicateConnection and are then terminated.

~~~json
{
  "email": String,
  "password": String
}
~~~

Response:
~~~json
{
  "status": "ok",
  "data": {session: <session>}
}
~~~

_<session>_ is the authentication token you must include in every subsequent request.

Response, in case of failure:
~~~json
{
  "status" : "ko",
  "messages": <errors>,
  "data": null}
}
~~~

Errors:<br />
E_INVALID_REQUEST : In case of missing attributes<br />
E_INVALID_ACCOUNT : The email is incorrect<br />
E_BAD_PASSWORD : The password is incorrect<br />

### View stats

GET data

route: BASE/stats

~~~json
{
  "usersCount": Number,
  "pollsCount": Number,
  "openPollsCount": Number
}
~~~

Returns basic information about the app.

* usersCount: Number of users
* pollsCount: Number of polls created by our users
* openPollsCount: Number of currently opened polls

Example:
~~~json
{
  "usersCount": 2,
  "pollsCount": 1,
  "openPollsCount": 1
}
~~~

### Edit password

PUT data

route: BASE/account/password

~~~json
{
  "password": String
}
~~~

_password_ must be at least 8 characters in length.

Errors:<br />
E_BAD_PASSWORD : The password is too weak<br />
E_INVALID_SESSION: No session provided or the provided session is invalid<br />
E_GENERIC_ERROR : An internal error as occured

### Get a list of polls in which I have participated

GET request

route: BASE/participations

No payload.

~~~json
{
  "status": "ok",
  "data": {
    "polls":[
	          {
			    "_id": "460f5c191942bb7bbd5407682ea113eb989b31c9",
			    "state": "completed",
			    "name":"SuperPOLL"
			  }
			]
  }
}
~~~


### Duplicate an existing poll

You can only duplicate your own polls.

POST request

route: BASE/poll/$id/duplicate

No payload.

name: name of the poll

~~~json
{
  "data": String
}
~~~

data: id of the duplicated poll

Errors:<br />
* E_INVALID_IDENTIFIER : Poll not found
* E_UNAUTHORIZED : You did not create this poll
* E_GENERIC_ERROR : Cannot add poll
* E_INVALID_SESSION : Invalid or no session provided

### Create a new poll

POST request

route: BASE/poll

~~~json
{
  "name": String,
  "questions": [{
    "name": String,
    "allowAnonymous": Boolean,
    "maxVote": Integer,
    "timeout": Integer,
    "answers": [{
        "name"
      }]
    }]
}
~~~

name: Must be between 3 and 30 characters in length<br />
questions: Is an array of questions. At least one must be provided.

For each question (each poll must contain at least one question):<br />

* name: This is the question that will be displayed. Must be between 5 and 50 characters is length.<br />
* allowAnonymous: When set to _true_, your audience and yourself will not be able to see who voted. When anonymous vote is allowed, expect less details in the poll report.<br />
* maxVote: Maximum number of votes each person can cast on the question. Must be between 1 and 10.<br />
* timeout: Number of seconds during which the question will be shown. Once expired, voting on the question is no more allowed. Must be between 15 and 600 seconds.<br />
* answers : array of possible answers for this question<br />

For each answer (each question must contain at least 2 answers):
name: Name of the displayed vote option

Each poll can contain a maximum of 50 questions and each question must not contain more than 10 answers.

Once created, the poll is in pending state. You are then free to open it. If you want to edit it, you can do so before it is opened.

Example:

~~~json
{
	"name": "SuperPOLL",
	"questions": [
	               {"name" : "How is the weather today?",
				    "allowAnonymous": false,
					"maxVote": 5,
					"timeout": 30,
					"answers": [
					             {"name": "Good"},
								 {"name": "Not bad"},
								 {"name": "Excellent"},
								 {"name": "Could be better"}
							    ]
					},

					{"name": "Yes or no?",
					 "allowAnonymous": false,
					 "maxVote": 5,
					 "timeout": 30,
					 "answers": [
					             {"name": "Yes"},
								 {"name": "No"}
								]
					}
				  ]
}
~~~

Errors:<br />
E_INVALID_REQUEST : In case of missing or invalid attributes<br />
E_AT_LEAST_ONE_QUESTION : There must be at least one question<br />
E_AT_LEAST_TWO_ANSWERS : For each question, there must be at least two answers<br />
E_GENERIC_ERROR : An internal error as occured

### Edit an existing poll

PUT request

route: BASE/poll/$id

Same request format as Create a new poll.

~~~json
{
  "name": String,
  "questions": [{
    "name": String,
    "allowAnonymous": Boolean,
    "maxVote": Integer,
    "timeout": Integer,
    "answers": [{
        "name"
      }]
    }]
}
~~~

Errors:<br />
E_INVALID_SESSION: No session provided or the provided session is invalid<br />
E_INVALID_REQUEST : In case of missing attributes or invalid id specified<br />
E_AT_LEAST_ONE_QUESTION : There must be at least one question<br />
E_AT_LEAST_TWO_ANSWERS : For each question, there must be at least two answers<br />
E_INVALID_STATE: The poll cannot be edited because it is either completed, closed or opened<br />
E_INVALID_IDENTIFIER: The specified id is invalid<br />
E_UNAUTHORIZED: You are not the poll owner<br />
E_GENERIC_ERROR : An internal error as occured

### Delete an existing poll

DELETE request

route: BASE/poll/$id

You can only delete your own polls and they must be in one of these states: pending, closed, completed

Errors:<br />
E_INVALID_SESSION: No session provided or the provided session is invalid<br />
E_INVALID_REQUEST : In case of missing attributes or invalid id specified<br />
E_INVALID_STATE: The poll cannot be deleted because it is currently opened<br />
E_UNAUTHORIZED: You are not the poll owner<br />
E_GENERIC_ERROR : An internal error as occured

### Open a poll

POST data
route: BASE/poll/opened/$id

Opening a poll is the process of accepting new clients who will be able to vote.
A poll can only be opened when it is in the pending state, and only once.

Once opened, a poll can be joined using a socket.io client. Refer to the socket.io section for more details.

A poll is automatically closed 6 hours after it is opened. In that case, it will be assigned the closed state.

In normal circumstances, when the poll is successfully completed, it will be assigned the completed state. You will then be able to view the completed poll.

Errors:<br />
E_INVALID_SESSION: No session provided or the provided session is invalid<br />
E_UNAUTHORIZED: You can only open a poll you have created<br />
E_INVALID_IDENTIFIER: The specified poll does not exist<br />
E_INVALID_STATE: This poll is either completed, already opened or has expired.<br />
E_GENERIC_ERROR: The poll could not be updated because of an internal error

### Search users by email

GET data
route: BASE/users/email/$email

This method allows you to search users by their email address.
A maximum of 15 users having their email address starting with $email will be returned and, for each, a list of their opened polls is provided.

Example:

~~~json
[{
  "email": String,
  "polls": [{ "_id": String,
			   "name" String,
			   "creation_date": Date
			}]
}]
~~~

The supplied email address must be at least 3 characters in length.

Errors:<br />
E_INVALID_SESSION: No session provided or the provided session is invalid<br />
E_INVALID_REQUEST : When the supplied email address is too short<br />

### View poll

Only the poll's owner and people who joined it can view it.

GET request

route: BASE/poll/$id

When the poll is pending, the following response is provided:

~~~json
{
  "_id": String,
  "name": String,
  "questions": [{
      "_id": String,
      "name": String,
      "allowAnonymous": Boolean,
      "maxVote": Integer,
      "timeout": Integer,
      "answers": [{
	    "_id": String,
        "name": String
      }]
    }]
}
~~~

When the poll is completed, the following response is provided:
~~~json
{
  "_id": String,
  "name": String,
  "questions": [{
      "_id": String,
      "name": String,
      "allowAnonymous": Boolean,
      "maxVote": Integer,
      "timeout": Integer,
      "answers": [{
	    "_id": String,
        "name": String
		"users": [ {
		              "anonymous": Boolean,
                  "timing": Number,
					  "user": {
					             "_id": String,
								 "email": String,
								 "firstname": String,
								 "lastname": String
					   }
					}]
      }]
    }]
}
~~~

questions.users.timing: Delta(timeWhenVoteReceived, timeWhenQuestionStarted) in milliseconds

Note: when questions.answers.users.anonymous is set to True, the questions.answers.users.user attribute is not included.

Example:

~~~json
{
  "status":"ok",
  "messages":[

  ],
  "data":{
    "_id":"5a39987657e8f45eea39fa32e3b5a85d120eeb8b",
    "state":"completed",
    "created_by":"d221b823f0ec6671b85e56d911c8f305735a5f01",
    "creation_date":"2015-10-21T20:28:49.226Z",
    "name":"SuperPOLL",
    "__v":0,
    "questions":[
      {
        "_id":"5a39987657e8f45eea39fa32e3b5a85d120eeb8b-0",
        "name":"How is the weather today?",
        "maxVote":5,
        "allowAnonymous":false,
        "timeout":30,
        "answers":[
          {
            "name":"Good",
            "_id":"5a39987657e8f45eea39fa32e3b5a85d120eeb8b-0-0",
            "users":[
              {
                "anonymous":false,
                "timing": 1200,
                "user":{
                  "_id":"86b96d75f851c982204c8707fb62248996462581",
                  "email":"test@test.com2",
                  "firstname":"Bon",
                  "lastname":"Bon"
                }
              },
              {
                "anonymous":false,
                "timing": 1231,
                "user":{
                  "_id":"50760a3f94ff03361a3948c46a13b33fbd9570d2",
                  "email":"test@test.com3",
                  "firstname":"test@test.com3",
                  "lastname":"test@test.com3"
                }
              }
            ]
          },
          {
            "name":"Not bad",
            "_id":"5a39987657e8f45eea39fa32e3b5a85d120eeb8b-0-1",
            "users":[

            ]
          },
          {
            "name":"Excellent",
            "_id":"5a39987657e8f45eea39fa32e3b5a85d120eeb8b-0-2",
            "users":[
              {
                "anonymous":false,
                "timing": 1763,
                "user":{
                  "_id":"50760a3f94ff03361a3948c46a13b33fbd9570d2",
                  "email":"test@test.com3",
                  "firstname":"test@test.com3",
                  "lastname":"test@test.com3"
                }
              }
            ]
          },
          {
            "name":"Could be better",
            "_id":"5a39987657e8f45eea39fa32e3b5a85d120eeb8b-0-3",
            "users":[
              {
                "anonymous":false,
                "timing": 3428,
                "user":{
                  "_id":"86b96d75f851c982204c8707fb62248996462581",
                  "email":"test@test.com2",
                  "firstname":"Bon",
                  "lastname":"Bon"
                }
              },
              {
                "anonymous":false,
                "timing": 3988,
                "user":{
                  "_id":"50760a3f94ff03361a3948c46a13b33fbd9570d2",
                  "email":"test@test.com3",
                  "firstname":"test@test.com3",
                  "lastname":"test@test.com3"
                }
              }
            ]
          }
        ]
      },
      {
        "_id":"5a39987657e8f45eea39fa32e3b5a85d120eeb8b-1",
        "name":"Yes or no?",
        "maxVote":5,
        "allowAnonymous":false,
        "timeout":30,
        "answers":[
          {
            "name":"Yes",
            "_id":"5a39987657e8f45eea39fa32e3b5a85d120eeb8b-1-0",
            "users":[
              {
                "anonymous":false,
                "timing": 1876,
                "user":{
                  "_id":"50760a3f94ff03361a3948c46a13b33fbd9570d2",
                  "email":"test@test.com3",
                  "firstname":"test@test.com3",
                  "lastname":"test@test.com3"
                }
              },
              {
                "anonymous":false,
                "timing": 6711,
                "user":{
                  "_id":"86b96d75f851c982204c8707fb62248996462581",
                  "email":"test@test.com2",
                  "firstname":"Bon",
                  "lastname":"Bon"
                }
              },
              {
                "anonymous":false,
                "timing": 6900,
                "user":{
                  "_id":"86b96d75f851c982204c8707fb62248996462581",
                  "email":"test@test.com2",
                  "firstname":"Bon",
                  "lastname":"Bon"
                }
              },
              {
                "anonymous":false,
                "timing": 7088,
                "user":{
                  "_id":"86b96d75f851c982204c8707fb62248996462581",
                  "email":"test@test.com2",
                  "firstname":"Bon",
                  "lastname":"Bon"
                }
              },
              {
                "anonymous":false,
                "timing": 8977,
                "user":{
                  "_id":"86b96d75f851c982204c8707fb62248996462581",
                  "email":"test@test.com2",
                  "firstname":"Bon",
                  "lastname":"Bon"
                }
              },
              {
                "anonymous":false,
                "timing": 8977,
                "user":{
                  "_id":"86b96d75f851c982204c8707fb62248996462581",
                  "email":"test@test.com2",
                  "firstname":"Bon",
                  "lastname":"Bon"
                }
              },
              {
                "anonymous":false,
                "timing": 8997,
                "user":{
                  "_id":"50760a3f94ff03361a3948c46a13b33fbd9570d2",
                  "email":"test@test.com3",
                  "firstname":"test@test.com3",
                  "lastname":"test@test.com3"
                }
              }
            ]
          },
          {
            "name":"No",
            "_id":"5a39987657e8f45eea39fa32e3b5a85d120eeb8b-1-1",
            "users":[
              {
                "anonymous":false,
                "timing": 9121,
                "user":{
                  "_id":"50760a3f94ff03361a3948c46a13b33fbd9570d2",
                  "email":"test@test.com3",
                  "firstname":"test@test.com3",
                  "lastname":"test@test.com3"
                }
              },
              {
                "anonymous":false,
                "timing": 12345,
                "user":{
                  "_id":"50760a3f94ff03361a3948c46a13b33fbd9570d2",
                  "email":"test@test.com3",
                  "firstname":"test@test.com3",
                  "lastname":"test@test.com3"
                }
              }
            ]
          }
        ]
      },
      {
        "_id":"5a39987657e8f45eea39fa32e3b5a85d120eeb8b-2",
        "name":"What do you prefer?",
        "maxVote":1,
        "allowAnonymous":true,
        "timeout":30,
        "answers":[
          {
            "name":"Yellow",
            "_id":"5a39987657e8f45eea39fa32e3b5a85d120eeb8b-2-0",
            "users":[
              {
                "anonymous":true,
                "timing": 4566
              }
            ]
          },
          {
            "name":"Orange",
            "_id":"5a39987657e8f45eea39fa32e3b5a85d120eeb8b-2-1",
            "users":[
              {
                "anonymous":false,
                "timing": 22244,
                "user":{
                  "_id":"86b96d75f851c982204c8707fb62248996462581",
                  "email":"test@test.com2",
                  "firstname":"Bon",
                  "lastname":"Bon"
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

Errors:<br />
E_INVALID_SESSION: No session provided or the provided session is invalid<br />
E_INVALID_IDENTIFIER: The specified id is invalid<br />
E_INVALID_STATE: The poll cannot be viewed because it is either in the opened or closed state<br />
E_UNAUTHORIZED: You are not allowed<br />

### List my polls

GET request

route: BASE/polls

response:
~~~json
{
  "_id": String,
  "name": String,
  "creation_date": Date,
  "state": String
}
~~~

Example:

~~~json
{
  "status": "ok",
  "messages": [],
  "data": [
			{
			  "_id": "5a39987657e8f45eea39fa32e3b5a85d120eeb8b",
			  "state": "completed",
			  "creation_date": "2015-10-21T20:28:49.226Z",
			  "name": "Poll A"
			},
			{
			  "_id": "e3dd2ecd0edcb753513fff2601b4f5f73dafdd32",
			  "state": "pending",
			  "creation_date": "2015-10-22T10:55:25.790Z",
			  "name": "Poll B"
			}
		  ]
}
~~~

Errors:<br />
E_INVALID_SESSION: No session provided or the provided session is invalid<br />

# Socket.io

Socket.io is used once a poll is opened and until it is closed or completed. You will use it to :

* Cast your vote
* Receive live results
* Be notified of the next question

The endpoint is the same server and port as the Web server. Encoding is UTF-8.
Once connected, start by sending the authAndJoin message.

The following sequence diagram shows which messages are exchanged in a 2-question poll:

![SocketIOSequenceDiagram](./pictures/socketio_sequence_diagram_v0.png)

1.

  1. The speaker joins by first connecting a socket.io instance to the server.
  2. He sends an authAndJoin message, which specifies which poll he wants to join.
  3. The server sends an authAndJoin response
  4. The speaker sets its listeners for the socket.io instance
  5. The speaker then issues a catchUp message
  6. The server sends the audienceList (all clients connected to the poll, except speakers), liveVoteResults (current results for the displayed question), nextQuestion (only if a question is shown!) and pollDetails (name of the poll)

2.

  1. Client2 joins the server using the same process as explained above
  2. The server responds with the authAndJoinResult and pollDetails messages
  3. The server notifies every speaker that a new client just joined the poll by issuing a userConnect message

3.

  1. The speaker starts the poll by sending the goNextQuestion message
  2. The server acknowledges by sending a goNextQuestionResult to the speaker
  3. A nextQuestion message is sent to every client in the poll. This message contains the question title and answers

4.

  1. Client2 wants to cast a vote. He sends the vote message to the server
  2. The server acknowledge the message by sending a voteResult message
  3. Each speaker connected to the poll is notified that a vote has been received using a liveVoteResults message. This message contains the results for the current question.

5.

  1. Client1 joins the server using the same process as explained above
  2. The server responds with the authAndJoinResult, pollDetails and nextQuestion (since a question is shown) messages
  3. The server notifies every speaker that a new client just joined the poll by issuing a userConnect message

6.

  Once the question timer reaches zero, the server issues the votingOnThisQuestionEnded message to each connected client in the poll. At this time, no more vote should be casted (must wait for the nextQuestion message)
  
7.

  Same as 3. (this time the process is shown with 3 clients instead of 2)
  
8.

  Same as 4. this time both clients cast their vote
  
9.

  Same as 6.
  
10.

  The server issues a pollCompleted message to each client connected to the poll
  
11.

  socket.io instances should now disconnect.


## Server => client messages

### pollDetails
Issued to the client after a successful authentication (authAndJoin)

Payload:
~~~json
{
  "name": String
}
~~~

name: name of the poll you just joined

### userDisconnect
Issued to the speaker when a previously connected user has disconnected

Payload: String - the user id

### userConnect
Issued to the speaker when a used joined the poll

Payload:
~~~json
{
  "_id": String,
  "firstName": String,
  "lastName": String,
  "email": String,
  "voted": Boolean | Null,
}
~~~
voted: Is always null when the current question allows anonymous voting. It is set to false when the poll has not yet started or is closed. Otherwise indicates if the user already casted at least one (non-anonymous) vote on the current question.




### audienceList
Issued to the speaker just after reception of the catchUp message.
This message contains a list of all people connected to the poll (exception: speakers are not listed)

Payload: Array
~~~json
[
	{
	  "_id": String,
	  "firstName": String,
	  "lastName": String,
	  "email": String,
	  "voted": Boolean | Null,
	}
]
~~~

voted: Is always null when the current question allows anonymous voting. Otherwise indicates if the user already casted at least one vote on the current question (values: true or false)

Example:

~~~json
[
	{
	  "_id": "5a39987657e8f45eea39fa32e3b5a85d120eeb89",
	  "firstName": "Paul",
	  "lastName": "Dupont",
	  "email": "paul.dupont@mail.com",
	  "voted": false
	},
	{
	  "_id": "5a39987657e8f45eea39fa32e3b5a85d120eeb81",
	  "firstName": "Sophie",
	  "lastName": "Perette",
	  "email": "sophie.perette@mail.com",
	  "voted": true
	},
]
~~~

### nextQuestion
Issued to the speaker and the audience at the request of the speaker or when someone reconnects to the poll

~~~json
{
	"timeout": Number,
	"question": {
      "_id": String,
      "name": String,
      "allowAnonymous": Boolean,
      "maxVote": Integer,
      "timeout": Integer,
      "answers": [{
	    "_id": String,
        "name": String
      }]
    }
	"voted": Number,
	"current": Number,
	"total": Number,

}
~~~

timeout is in most cases the question timeout (in seconds). However, if you join a poll during the voting period, this value will be lower ; in that case the voted field will contain the number of votes you already casted on this question.
You must only allow voting for this specified amount of time once the message is received.

current denotes the position of the question in the poll (1=first question)<br />
total is the number of questions in the poll


### goNextQuestionResult
Issued in response to the goNextQuestion message.

~~~json
{
  "status": ("ok"|"ko"),
  "messages": [ {"error": String,
                 "description": String }
			  ]
}
~~~

Response in case of success:
~~~json
{
  "status": "ok",
  "messages": []
}
~~~

Response in case of error:
~~~json
{
  "status": "ko",
  "messages": [ { "error": "E_UNAUTHORIZED",
                  "description": "You are either not authenticated or not a speaker"
				} ]
}
~~~

Errors:<br />
E_UNAUTHORIZED: You are either not authenticated or not a speaker

### liveVoteResults
Issued to the speaker when someone sends a vote or when the speaker reconnects to the poll.

~~~json
{
	"results": [
				{
				  count: 5
				},
				{
				  count: 7
				},
			   ],
	"whovoted": String,
	"timing": Number
}
~~~

results: contains for each answer the number of votes casted. In the example above 5 votes were casted for the first answer, and 7 for the second answer.
whovoted:
* is null when catching up or when the question allows anonymous voting and the person who just voted did choose to vote anonymously.
* is false if the poll is now closed or has not yet begun.
* When not null, it contains the id of the person who voted.
timing: Delta(timeWhenVoteReceived, timeWhenQuestionStarted) in milliseconds.

### voteResult

Issued in response to the vote message.

Response when the vote is registered:
~~~json
{
  "status": "ok",
  "messages": []
}
~~~

Response in case of error:
~~~json
{
  "status": "ko",
  "messages": [ { "error": "E_UNAUTHORIZED",
                  "description": "You are not authorized"
				} ]
}
~~~

Errors:<br />
E_UNAUTHORIZED: You are not authenticated<br />
E_GENERIC_ERROR: A generic error occured (you specified an invalid answer index, the poll is completed or voting has ended)

### authAndJoinResult
Issued in response to the authAndJoin message.

The server will choose to make you join the poll as speaker (if you are the poll"s owner) or as audience (otherwise).

Once you receive this message, you should create your event listeners and then, when ready, send the catchUp message.

Example, when joining as speaker:
~~~json
{
  "status": "ok",
  "data": "speaker"
}
~~~

Example, when joining as audience:
~~~json
{
  "status": "ok",
  "data": "audience"
}
~~~

Example, in case of error:
~~~json
{
  "status": "ko",
  "messages": [ { "error": "E_INVALID_IDENTIFIER",
                  "description": "The specified poll does not exist or is not opened"
				} ]
}
~~~

Errors:<br />
E_UNAUTHORIZED: You are not allowed to join this poll<br />
E_INVALID_IDENTIFIER: The specified poll does not exist or is not opened<br />

### duplicateConnection

This message is issued when the same user just connected to the same poll while he was already connected to that one.<br />
The new connection is authorized while all others connected to the same poll receive this message and are then disconnected.

No payload.

### pollCompleted
Issued when the poll is completed.

No payload.

### votingOnThisQuestionEnded
Issued when the timeout of the current question reached 0. The server will not accept voting on this queston anymore.

No payload.

## Client => server messages

## authAndJoin
This message is the first to be issued to the server.

~~~json
{
  "session": String,
  "poll": String
}
~~~

session: same session id obtained using the authenticate REST API method<br />
poll: poll id you want to join. The poll must be opened.

The server will then issue an authAndJoinResponse message.

## catchUp
This message is issued after a successful authAndJoin<br />
It tells the server that you are ready to receive asynchronous messages.<br />
The server will not respond when a catchUp message is sent from an unauthenticated client.

Once sent, the server will immediately send you these messages, so you can catch up:
* audienceList (only if you are a speaker)
* liveVoteResults (only if you are a speaker)
* nextQuestion (only if a question is displayed)
* pollDetails

When the server receives this message, it will issue a userConnect message to the speakers.

No payload.

## goNextQuestion
This message is sent to go to the next question in the poll. Only a speaker can issue this message. It is required to issue this message to display the first question.<br />

This will result in either a broadcast (to all connected clients who joined the same poll) of:
* a nextQuestion message, if the current question is not the last question in the poll.
* a pollCompleted message, if the current question is the last question in the poll.

No payload.

## vote
This message is used to cast a vote.

~~~json
{
  "answerIndex": Number,
  "voteAsAnonymous": Boolean
}
~~~

* answerIndex: the index of the question to cast a vote for. <br />
* voteAsAnonymous: true will keep your vote private (if the question allows anonymous voting only) - your name will not be displayed. Specify any value when the current question does not accept anonymous voting.<br />

If this vote is accepted, a liveVoteResults message is then issued to the speakers.<br />
A voteResult is sent in response to you.<br />
