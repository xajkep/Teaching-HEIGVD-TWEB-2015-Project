# How to obtain a free certificate from the <a href="https://letsencrypt.org">Let's encrypt initiative</a>

Let's encrypt use the ACME protocol in order to simplify the process, which becomes very straightforward.
The provided utility will automatically generate a new keypair and validate that you are the owner of the domain by creating a server (to respond to the challenges of the validation server).

A standard certificate will be given to you absolutely free of charge. It is valid for 1 year and is renewable.

Execute the following commands, in order:

	apt-get updateapt-get
	apt-get install git
	apt-get install python
	wget https://bootstrap.pypa.io/get-pip.py
	python get-pip.py
	git clone https://github.com/letsencrypt/letsencrypt
	cd letsencrypt
	./letsencrypt-auto certonly --standalone --email `YOUR_EMAIL` -d `YOUR_DOMAIN_NAME`

You'll find the private key and your certificate in the following location: /etc/letsencrypt/live/`YOUR_DOMAIN_NAME`/
Make sure to make a backup of it.

Warning: at least 50MB of free RAM are required in order to execute the last command.
