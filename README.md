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

* User manual
* Sequence diagram explaining which messages are exchanged between clients and the server and when
* Authentication process
* Poll creation (new & edit)
* Search opened polls by their owner email
* Join a poll as speaker:
  * Start the poll
  * View live activity (answers graph, participation graph and votes count are automatically updated as users vote)
  * Consult poll results once it's done
* Delete a poll (must not be in the opened state)
* Join a poll as audience:
  * The interface only allows voting for the alloted time
  * Possible answers are displayed and the user can select them
* The poll supports user reconnection for both the speaker and the audience

Still to be done/improved:
* Create a formal test script

Known bugs:
* When a user fails to join a poll by clicking on Join, he cannot proceed to join another poll.

  This seems to be fixed by explicitely specifying we want a new socket.io connection on the client side when establishing a connection.
  
* Heroku restarts our application several times per day. This impairs the good execution of the hard timeout we implemented.
  Thus, polls that happened to be opened when Heroku decided to restart our app are not closed. This is not regarded as an app issue since it does not happen with any other hoster.