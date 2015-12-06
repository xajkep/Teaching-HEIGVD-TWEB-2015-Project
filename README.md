# TWEB Project Repository

Project members
========================================
Julien Amacher<br />
Thibault Schowing<br />
Widmer Yannick<br />
Benoit Zuckschwerdt

Websites
========================================

The app is available here: https://shrouded-falls-6875.herokuapp.com <br />
Our presentation website is available here: http://julienamacher.github.io/twebpres/

Documentation
========================================

<a href="USERMAN.md">User manual</a> <strong>New</strong><br />

<a href="specifications/Specifications.md">Specifications</a><br />
<a href="specifications/api_spec.md">API specifications</a> <strong>Added sequence diagram</strong>

Done in part 2
========================================

* Socket.IO implemented on both the client and the server

  For segregating polls and speakers/audience in each poll, we used the <a href="http://socket.io/docs/rooms-and-namespaces/">rooms feature</a> provided by Socket.io.
  When a user joins, the server makes it join either the `poll_POLL-ID_speaker` (if he is the poll owner) or the `poll_POLL-ID_audience` room. In either case we make them join the `poll_POLL-ID` room as well for ease of use.

* <a href="USERMAN.md">User manual</a>
* <a href="specifications/api_spec.md">Sequence diagram</a> explaining which messages are exchanged between clients and the server and when
* Authentication process
* Poll creation (new & edit)
* Password change
* Search opened polls by their owner email
* Join a poll as speaker:
  * Start the poll
  * View live activity (answers graph, participation graph and votes count are automatically updated as users vote)
  * Consult poll results once it's done
* Delete a poll (must not be in the opened state)
* Join a poll as audience:
  * The interface only allows voting for the alloted time
  * Possible answers are displayed and the user can select them
  * Anonymous volting is possible only when the question allows it
* The poll supports user reconnection for both the speaker and the audience
* Verification by the server that the same user is not already connected to the same poll. If it is, then the first session is terminated.
* Segregated AngularJs controllers and factories into their own .js file
* Segregated NodeJS controllers into their own .js file
* The NodeJS server now requires the DATABASE_STRING and SESSION_SECRET environment variables be defined.
  
  * DATABASE_STRING : Must be a valid MongoDB connection string
  * SESSION_SECRET : Secret used to sign the session and thus ensure it has not been tampered with by the client
  
  To do so, on Windows, execute the following:
  
  * SET DATABASE_STRING=mongodb://tweb:dwmrqi5y@ds043694.mongolab.com:43694/tweb
  * SET SESSION_SECRET=VlL_LGgy5yu89-nW+7U6f7u0TbIlmP.z
  
  And on Unix systems, execute the following:
  
  * export DATABASE_STRING=mongodb://tweb:dwmrqi5y@ds043694.mongolab.com:43694/tweb
  * export SESSION_SECRET=VlL_LGgy5yu89-nW+7U6f7u0TbIlmP.z
  
  When exporting to Heroku:
  
  * heroku config:set DATABASE_STRING=mongodb://tweb:dwmrqi5y@ds043694.mongolab.com:43694/tweb
  * heroku config:set SESSION_SECRET=VlL_LGgy5yu89-nW+7U6f7u0TbIlmP.z
  
* Bugs corrected on 2012-12-04:

    - When a speaker opens another poll in the same session, previously connected users were displayed.
	- A user could cast more votes than they were allowed. The server was not checking the correct variable (currentQuestion.maxVote)

Still to be done/improved:
* Create a formal test script that will emulate users in the poll

Known bugs:
* When a user fails to join a poll by clicking on Join, he cannot proceed to join another poll.

  This seems to be fixed by explicitely specifying we want a new socket.io connection on the client side when establishing a connection.
  
* Heroku restarts our application several times per day. This impairs the good execution of the hard timeout we implemented.
  Thus, polls that happened to be opened when Heroku decided to restart our app are not closed. This is not regarded as an app issue since it does not happen with any other hoster.
  
  
To manage opened polls, we have considered the following options:
* Loading the poll title and the current question when each client requests it, from the database.
  This would cause the same request to be sent to the database many times.
  
* Loading the poll title and the next question in memory, then serving this information to clients requesting it. When any user cast a vote, it is added in the database.
  This uses a minimal amount of memory but writing each vote as it arrives to the database will send a lot of requests.
  
* Loading the entire poll in memory, and as the current question changes, the last one is removed from memory.
Once a question finishes, all votes are written in a single request to the database. This uses more memory but there is no prefetching of the next question to do.
This is the solution we decided to implement, primarily because we use a slow database in the Cloud (mongolab).

This process starts when a user decides to load a poll in memory:

![Poll memory and database interactions](./specifications/pictures/poll_db_memory_v0.png)

Exception: When the poll has been opened for more than 6 hours, it is automatically closed.

As an added optimization, questions that have already been displayed are unloaded from memory.

For our session management, we used the jsonwebtoken module. It allows the storage of the entire session on the client side.
The session is signed using a secret known only to the server in order to prevent clients from modifying its session data.


