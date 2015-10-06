# API REST Specifications

* Every message and response is encoded in UTF-8.
* Each call (except login) must have the Authorization HTTP HEADER set with the user session (returned by the login request)
* Port: 1337
* BASE: /api/v1

## General request (if connected)

Note: use HTTP AUTH

'session': String


## General response

~~~json
{
  'status': ('ok'|'ko'),
  'messages': [String],
  'response': {}
}
~~~

## Requests

### Register

POST data

route: BASE/registration

~~~json
{
  'email': String,
  'firstname': String,
  'lastname': String,
  'password': String
}
~~~

onSuccess: auto sign in the user

### Login

POST data

route: BASE/signin

~~~json
{
  'email': String,
  'password': String
}
~~~

response:
~~~json
{
  'session': String
}
~~~

### Logout

POST data

route: BASE/logout

### Edit password

POST data

route: BASE/account/password/edition

~~~json
{
  'password': String
}
~~~

### Create poll

PUT request

route: BASE/poll/creation

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

### Delete poll

DELETE request

route: BASE/poll/deletion/$id

### Run poll

POST data
route: BASE/poll/running/$id

### Join poll

POST data
route: BASE/poll/join/$id

### View poll

GET request

route: BASE/poll/$id

response:
~~~json
{
  'name': String,
  'questions': [{
      'name': String,
      'allowAnonymous': Boolean,
      'maxVote' : Integer,
      'answers' : [{
        'name' : String
      }]
    }]
}
~~~

### View completed poll

GET request

route: BASE/poll/$id

response:
~~~json
{
  'name': String,
  'questions': [{
      'name': String,
      'allowAnonymous': Boolean,
      'maxVote' : Integer,
      'answers' : [{
        'name' : String,
        'voted' : [{
            'firstname' : String,
            'lastname' : String,
            'id' : String
          }]
      }]
    }]
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
