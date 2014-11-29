Webtail v0.1
============

Tails files on remote servers using an agent, and sends content to a main server.
The main server distributes content to web clients, using Socket.IO.

agent/
======

This directory hosts the tail agent application. 
An agent tails a set of configured files and sends content to a Webtail server, via HTTP.

server/
=======

This directory hosts the tail server application. 
One server is created for incoming agent data and one for realtime browser based data viewing.

Install and Configuration
=========================

Clone this repository on servers you wish to tail files on, and edit agent/configuration.ini. Change
values to suit your needs.

NOTE: Token value must match token value configured for the agent server.

Once the agent is configured, change directory to agent/ and issue:
npm install

To start the agent in the background, issue:
nohup nodejs agent.js > agent.log &

Clone this repository on a central server used for capturing tail content, and displaying it to
end used. Edit server/configuration.ini. Change values to suit your needs.

Once the server is configured, change directory to server/ and issue:
npm install

To start the agent in the background, issue:
nohup nodejs server.js > server.log &

Browse with as many clients as you wish to:
http://yourserver:port/?token=CONFIGUREDACCESSTOKEN

Security notes
==============

First version of Webtail authenticates users and agents using a configurable token. This
security mechanism is not reliable, however, placing the server behind an apache proxy and
configuring basic authentication would help.

Dependencies
============

This project is written in JavaScript for Node.JS, with the UI written in jQuery.

The agent application relies on:

https://github.com/lucagrulla/node-tail

https://github.com/isaacs/ini

http://momentjs.com/docs/

https://github.com/request/request


The server application relies on:

http://expressjs.com/

http://socket.io/docs/

https://github.com/isaacs/ini

https://www.npmjs.org/package/url

https://www.npmjs.org/package/body-parser

Todo
====

Currently, Webtail does not persist data. As such, a few features to implement are:
- Persist data using ElasticSearch
- Allow for searching historic content

A few security improvements:
- Add proper authentication mechanism
- Add SSL certificate support
- Add specific IP address server binding

UI improvements:
- Create a JS component, to allow code re-use
- Create UI for searching content and filtering by file and server
