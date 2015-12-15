# How to install the application on Debian

## Install MongoDB

* apt-key adv --keyserver keyserver.ubuntu.com --recv 7F0CEB10
* echo "deb http://repo.mongodb.org/apt/debian wheezy/mongodb-org/3.0 main" | tee /etc/apt/sources.list.d/mongodb-org-3.0.list
* apt-get update && apt-get install -y mongodb-org

MongoDB is automatically started.

## Install NodeJS

* apt-get install -y curl
* curl -sL https://deb.nodesource.com/setup_5.x | bash -
* apt-get install -y nodejs

## Test the application

Create a folder and put the contents of the `expressjs` folder in it.

Test if everything works as expected (this is not a suitable production configuration!) :

Execute the following commands to create the environment variables (WITHOUT modifying the `<TO-DO>`):

export DATABASE_STRING=mongodb://127.0.0.1:27017/tweb
export SESSION_SECRET=<TO-DO>
export PASSPORT_GITHUB_CLIENT_ID=<TO-DO>
export PASSPORT_GITHUB_CLIENT_SECRET=<TO-DO>
export PASSPORT_GITHUB_CALLBACK_URL=<TO-DO>
export PASSPORT_FACEBOOK_CLIENT_ID=<TO-DO>
export PASSPORT_FACEBOOK_CLIENT_SECRET=<TO-DO>
export PASSPORT_FACEBOOK_CALLBACK_URL=<TO-DO>

Finally, execute the following with a low provileged user: `nodejs app.js` in that folder to start it.

Using any browser, check that you can access the app on the port 8080.
