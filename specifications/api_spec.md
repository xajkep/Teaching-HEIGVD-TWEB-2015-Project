# API REST Specifications

Every message and response encoded in UTF-8.

BASE=/

## General esponse

~~~json
{
  'status': ('ok'|'ko'),
  'messages': [String]
}
~~~

## Messages

### Register

POST data
route: BASE/register

~~~json
{
  'email': String,
  'firstname': String,
  'lastname': String,
  'password': String,
  'confirm': String
}
~~~

onSuccess: auto sign in the user

### Login

POST data
route: BASE/login

~~~json
{
  'email': String,
  'password': String,
}
~~~

### Create poll

POST data
route: BASE/poll/create

~~~json
{
  'name': String,
  'questions': [{
    'name': String,
    'allowAnonymous': Boolean,
    'maxVote' : Integer
    'answers' : [{
        'name'
      }]
    }],
}
~~~

### Delete poll

POST data
route: BASE/poll/delete/$id

### Run poll

POST data
route: BASE/poll/run/$id

### Join poll

POST data
route: BASE/poll/join/$id

### View poll

POST data
route BASE/poll/$id

response:
~~~json
{
  'name': String,
  'questions': [{
      'name': String,
      'allowAnonymous': Boolean,
      'maxVote' : Integer
      'answers' : [{
        'name'
      }]
    }]
}
~~~

### Answer

POST data
route: BASE/poll/question/answer/$id


## Patterns

EMAIL = "\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b"
SHORTNAME = "[a-zA-Z]{1}[a-zA-Z0-9 -_]{2,60}" // firstname, lastname, poll.name
LONGNAME = "[a-zA-Z]{1}[a-zA-Z0-9 -_.!?]{2,255}" // question.name, answer.name
ID = "[0-9]{1,}"

## Errors

E_REQUIRED = "Please complete required inputs"

E_EMAIL = "This email is not valid"
E_NAME = "This name is not valid"
E_ID = "This id don't exist"

E_REGISTER_PWD_CONFIRM = "Passwords don't match"

E_POLL_CLOSED = "This poll is closed"
E_POLL_CREATE = "Bad format receive"

## Success

S_LOGIN = "Welome in the best TWEB project of the universe !!!"

S_POLL_CREATED = "Your poll has been created successfully"
S_POLL_DELETED = "Your poll has been deleted successfully"
S_POLL_RUNNING = "Your poll is now open"
S_POLL_JOINED = "Poll joined"

S_QUESTION_ANSWERED = "Answered !"
