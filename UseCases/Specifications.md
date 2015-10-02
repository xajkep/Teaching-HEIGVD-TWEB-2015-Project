TWEB - Project

Description of the product
========================================
QuickPoll is a web based application that allows a user to create, join, manage and answer to different polls.

Target users
========================================
Every person that want to get a free and fast poll tool. Here we'll use the example of a classroom.

Nowadays, nearly everybody in a school have a smartphone or a computer and we can use this to spare everybody's time ! If the teacher has questions to ask to the classroom he can prepare those questions in advance by creating a poll and when it's time to ask those questions to the students, he simply has to give them the link to the application and the poll number.


Description of the usecases
========================================
This section provides the first draft of the TWEB's project specifications and usecases.

![Usecases](./pictures/General_Usecases_V0.bmp)

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

![Mockup](./pictures/mockups_visio_v0.png)

Process flow
=========================================

1. Both teacher and student register in the application

2. Both clients log-in

3. The teacher create a poll and run it. He gets here the poll's ID he has to transmit to the students.

4. To create a poll the teacher has to add questions and possible answer to those

5. The student enter the poll's ID and join it

6. The student has joined the poll, he now has to wait the teacher to launch de quizz.

7. The teacher launch the poll

8. The question is displayed on the teacher's device during the allotted time.

9. The question and the possible answers are displayed on the student's device.

10. When the timer is at 0 OR if everybody's answered to the question the graphs are displayed on the teacher's device.

11. When the student's answered the question, he has to wait the teacher to click on the "next" or "end" button that will display the next question

12. Just like point 8

13. Just like point 9

14. If this is the last question, the teacher click the "end" button and return to the member's
page.

15. On the member's page, the user can view the previous poll's results.

16. The poll is at it's end, the user can just quit it.

17. When the user click on the "view" button, he can see the results of every questions of the poll.

High level architecture
=======================================

![high-level architecture](./pictures/architecture_bloc_v0.png)
