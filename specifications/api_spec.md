# API Specifications

### Register

POST data

~~~json
{
  'email': String,
  'password': String,
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

### Open poll

POST data

~~~json
{
  'id_poll': Integer
}
~~~

### Participate

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
