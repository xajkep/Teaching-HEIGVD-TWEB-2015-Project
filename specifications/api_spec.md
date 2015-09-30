# API Specifications

### Register

POST data

~~~json
{
  'email': String,
  'firstname': String,
  'lastname': String,
  'password': String,
  'confirm': String
}
~~~

### Login

POST data

~~~json
{
  'email': String,
  'password': String,
}
~~~

### Create poll

POST data

~~~json
{
  'name': String,
  'questions': [{
    'name': String,
    'allowAnonymous': Boolean,
    'answers' : [{
        'name'
      }]
    }],
}
~~~

### Run poll

POST data

~~~json
{
  'id_poll': Integer
}
~~~

### Join poll

POST data

~~~json
{
  'id_poll': Integer,
}
~~~

### View poll

POST data

~~~json
{
  'id_poll': Integer,
}
~~~

### Answer

POST data

~~~json
{
  'id_answer': String
}
~~~
