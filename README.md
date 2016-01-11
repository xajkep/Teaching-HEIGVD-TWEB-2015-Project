# TWEB Project Repository

Project members
========================================
Julien Amacher<br />
Thibault Schowing<br />
Widmer Yannick<br />
Benoit Zuckschwerdt

Websites
========================================

The app is available here: https://quickpoll.top <br /> <strong>New in part 3: SSL enabled</strong><br />
Our presentation website is available here: http://julienamacher.github.io/twebpres/

Documentation
========================================

* <a href="USERMAN.md">User manual</a> <strong>New in part 2</strong>
* <a href="specifications/Specifications.md">Specifications</a>
* <a href="specifications/api_spec.md">API specifications</a> <strong>New in part 2: added sequence diagram</strong>
* <a href="registerapp_github/howto.md">Create an application on GitHub</a> <strong>New in part 3</strong>
* <a href="registerapp_facebook/howto.md">Create an application on Facebook</a> <strong>New in part 3</strong>
* <a href="install_debian/howto.md">Install the environment on a Debian box</a> <strong>New in part 3</strong>
* <a href="letsencrypt/howto.md">Get a new certificate from the Let's encrypt initiative</a> <strong>New in part 3</strong>

Done in part 3
========================================

* Implemented Gravatar

  Users first need to configure their display picture.
  This is achieved by creating a Gravatar account using the same email address than the one they use to login with in our app.
  
  ![Gravatar config](./specifications/pictures/gravatar1.png)
  
  Then, when they join a poll, their picture is displayed alon their name:
  
  ![Gravatar display in poll](./specifications/pictures/gravatar2.png)

* Implemented SSO using <a href="https://github.com/cfsghost/passport-github">GitHub</a> and <a href="https://github.com/jaredhanson/passport-facebook">Facebook</a> using <a href="https://github.com/jaredhanson/passport">Passport</a>
  
  See our manuals on how to create applications:
  * <a href="registerapp_github/howto.md">Create an application on GitHub</a>
  * <a href="registerapp_facebook/howto.md">Create an application on Facebook</a>

  The following additional environment variables are now required:
  * PASSPORT_GITHUB_CLIENT_ID : GitHub Client ID
  * PASSPORT_GITHUB_CLIENT_SECRET : GitHub Client Secret
  * PASSPORT_GITHUB_CALLBACK_URL : GitHub OAuth Callback URL. IT MUST BE THE SAME THAN THE ONE REGISTERED IN YOUR GITHUB APPLICATION
  * PASSPORT_FACEBOOK_CLIENT_ID: Facebook Client ID
  * PASSPORT_FACEBOOK_CLIENT_SECRET Facebook Client Secret
  * PASSPORT_FACEBOOK_CALLBACK_URL : Facebook OAuth Callback URL. Again, must be the same than what is allowed in the Facebook app configuration (see the manual)

  18th December: Angular now receives the user's session in a cookie instead of receiving it as a URL parameter, which was displayed on screen for a plit second and thus represent a security issue.
  
* Taken into account the feedback of part 2:
  * Replaced setInterval and clearInterval with the Angular interval service.
  * Added debounce on the search by email field to reduce the number of requests sent to the server and thus reduce the load on the server
  * Removed 2 unused scope.apply calls
  * Forms can be submitted using the Enter key
  * Updated the Jekyll website to be more attractive
  * Removed alerts(). We are now using <a href="http://lobianijs.com/site/lobibox">Lobibox</a> for user notifications
  * Added the feature listing polls in which the user participated ("Participated" button once logged in the top right corner). Allows for re-joining a poll (if it is opened) or viewing its results (if it is completed). API has been modified to allow people who participated in the poll to view it, in addition of its owner.
  
* Added a feature listing every polls the user joined. This allows him to view its results or join the poll again (if it is not finished yet)

  ![Participations](./specifications/pictures/participations.png)

* Added a "Duplicate" button on the list of polls, which allows a user to duplicate any poll (the duplicate has of course no answer attached)

  ![Duplicate a poll](./specifications/pictures/duplicate.png)
  
* Added quickpoll.top domain
* Implemented SSL with a free certificate from <a href="https://letsencrypt.org/">Let's Encrypt</a>
  
  The following additional environment variables are necessary:
  
  * SSL_PRIVATE_KEY_PATH : Path of the private key (pem format). Should look like: /etc/letsencrypt/live/SITE/privkey.pem
  * SSL_CERTIFICATE_PATH : Path of the certificate (pem format). Should look like: /etc/letsencrypt/live/SITE/cert.pem
  
  And this one is optional:
  
  * SSL_REDIRECT_80_TO_SECURED : If its value is set to "true", an endpoint will listen on port 80 and redirect clients on the SSL endpoint (port 443)
  
* A <a href="install_debian/howto.md">manual</a> on how to install the required execution environment in order to execute the application.

  The server we are using is a 1.2€/month VPS in the Cloud at <a href="https://www.arubacloud.com/">Arubacloud</a> (<a href="https://www.arubacloud.com/free-trial.aspx">Free 10€ voucher</a>)
  
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
* The NodeJS server now requires the following environment variables be defined:
  
  * DATABASE_STRING : Must be a valid MongoDB connection string
  * SESSION_SECRET : Secret used to sign the session and thus ensure it has not been tampered with by the client
  * PASSPORT_GITHUB_CLIENT_ID : GitHub Client ID
  * PASSPORT_GITHUB_CLIENT_SECRET : GitHub Client Secret
  * PASSPORT_GITHUB_CALLBACK_URL : GitHub OAuth Callback URL
  * PASSPORT_FACEBOOK_CLIENT_ID : Facebook Client ID
  * PASSPORT_FACEBOOK_CLIENT_SECRET : Facebook Client Secret
  * PASSPORT_FACEBOOK_CALLBACK_URL : Facebook OAuth Callback URL
  
  To do so, on Windows, execute the following:
  
  * SET DATABASE_STRING=mongodb://tweb:dwmrqi5y@ds043694.mongolab.com:43694/tweb
  * SET SESSION_SECRET=VlL_LGgy5yu89-nW+7U6f7u0TbIlmP.z
  * SET PASSPORT_GITHUB_CALLBACK_URL=https://shrouded-falls-6875.herokuapp.com/api/v1/callbacks/github
  * SET PASSPORT_FACEBOOK_CALLBACK_URL=https://shrouded-falls-6875.herokuapp.com/api/v1/callbacks/facebook
  * (+ PASSPORT_GITHUB_CLIENT_ID)
  * (+ PASSPORT_GITHUB_CLIENT_SECRET)
  * (+ PASSPORT_FACEBOOK_CLIENT_ID)
  * (+ PASSPORT_GITHUB_CLIENT_SECRET)
  * (+ PASSPORT_FACEBOOK_CLIENT_ID)
  * (+ PASSPORT_FACEBOOK_CLIENT_SECRET)
  * (+ PASSPORT_FACEBOOK_CALLBACK_URL)
  
  * export DATABASE_STRING=mongodb://tweb:dwmrqi5y@ds043694.mongolab.com:43694/tweb
  * export SESSION_SECRET=VlL_LGgy5yu89-nW+7U6f7u0TbIlmP.z
  * export PASSPORT_GITHUB_CALLBACK_URL=https://shrouded-falls-6875.herokuapp.com/api/v1/callbacks/github
  * (+ PASSPORT_GITHUB_CLIENT_ID)
  * (+ PASSPORT_GITHUB_CLIENT_SECRET)
  * (+ PASSPORT_FACEBOOK_CLIENT_ID)
  * (+ PASSPORT_GITHUB_CLIENT_SECRET)
  * (+ PASSPORT_FACEBOOK_CLIENT_ID)
  * (+ PASSPORT_FACEBOOK_CLIENT_SECRET)
  * (+ PASSPORT_FACEBOOK_CALLBACK_URL)
  
  When exporting to Heroku:
  
  * heroku config:set DATABASE_STRING=mongodb://tweb:dwmrqi5y@ds043694.mongolab.com:43694/tweb
  * heroku config:set SESSION_SECRET=VlL_LGgy5yu89-nW+7U6f7u0TbIlmP.z
  * heroku config:set PASSPORT_GITHUB_CALLBACK_URL=https://shrouded-falls-6875.herokuapp.com/api/v1/callbacks/github
  * (+ PASSPORT_GITHUB_CLIENT_ID)
  * (+ PASSPORT_GITHUB_CLIENT_SECRET)
  * (+ PASSPORT_FACEBOOK_CLIENT_ID)
  * (+ PASSPORT_GITHUB_CLIENT_SECRET)
  * (+ PASSPORT_FACEBOOK_CLIENT_ID)
  * (+ PASSPORT_FACEBOOK_CLIENT_SECRET)
  * (+ PASSPORT_FACEBOOK_CALLBACK_URL)
  
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


