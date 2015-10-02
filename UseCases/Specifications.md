TWEB - Project

Description of the product
========================================
QuickPoll is a web based application that allows a user to create, join, manage and answer to different polls.

Target users
========================================
Every person that want to get a free and fast question asking tool for all kind of audience.


Description of the usecases
========================================
This document provides the first draft of the TWEB's project specifications and usecases.


----------------------------------------
1) Login
----------------------------------------
The user arrives on the start page of the app where he has two choices:
	Create an account, which include to give an e-mail address and a password
	Login with the credentials

----------------------------------------
2) Create Poll
----------------------------------------
Once the user is logged, he can create a Poll by giving it a name, and editing the
questions and the answers.
For each question, you can choose if it is possible to answer anonymously to it or not.

----------------------------------------
3) Open Poll
----------------------------------------
When the Poll is ready to be used by others users, the creator can open it. He receive
a number which will allow the authorized users to find and complete the Poll. The Poll's
creator, can now launch the first question, which will be displayed on every logged users devices.
A question can have a timer that allows the user to answer only during the allotted time.
The results are live updated while the users validate their answers.
After each questions, the creator can view the results and switch to the next question, or
directly switch to the next one.

----------------------------------------
4) Close Poll
----------------------------------------
When all questions have been answered by the users, the creator can close the poll.
The users can't access the questions anymore.
The creator can view the results of every questions of the Poll.

----------------------------------------
5) Participate
----------------------------------------
The logged user can enter the identification number of the Poll he wants to participate to.
He then waits the first questions to be activated.
If a user log-in in a Poll after it began, he has to wait for the creator to switch to the next
question to be able to answer to it.
On the teacher's screen the graphs (vote results) automatically refresh themselves when a student vote.

Mockup
=========================================

![Mockup](./mockups_visio_v0.png)

High level architecture
=======================================
