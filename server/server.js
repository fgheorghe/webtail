/**
 Copyright (c) 2014, Grosan Flaviu Gheorghe
 All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:
 1. Redistributions of source code must retain the above copyright
 notice, this list of conditions and the following disclaimer.
 2. Redistributions in binary form must reproduce the above copyright
 notice, this list of conditions and the following disclaimer in the
 documentation and/or other materials provided with the distribution.
 3. All advertising materials mentioning features or use of this software
 must display the following acknowledgement:
 This product includes software developed by Grosan Flaviu Gheorghe.
 4. Neither the name of Grosan Flaviu Gheorghe nor the
 names of its contributors may be used to endorse or promote products
 derived from this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY Grosan Flaviu Gheorghe ''AS IS'' AND ANY
 EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL Grosan Flaviu Gheorghe BE LIABLE FOR ANY
 DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
// Application constructor. Takes in a full path to an ini configuration file.
var WebTailServer = function (configFileName) {
    this.configFileName = configFileName;
    this.init();
};

// Initializes the application, by loading dependencies and
// creating the HTTP server.
WebTailServer.prototype.init = function () {
    // Load required modules.
    this.modules = {
        express: require('express'),
        bodyParser: require('body-parser'),
        http: require('http'),
        socketIo: require('socket.io'),
        fs: require('fs'),
        ini: require('ini'),
        url: require('url')
    };

    // Load configuration.
    this.readConfiguration();

    // Create the agent HTTP server, including socket.io.
    this.createAgentWebServer();

    // Create the socket.io HTTP server.
    this.createClientWebServer();
}

// Handles a new socket connection.
WebTailServer.prototype.ioConnectionHandler = function (socket) {
    console.log("New client connected: " + socket.handshake.address);
    // Register disconnect handler.
    socket.on('disconnect', this.socketDisconnectHandler(socket).bind(this));
}

// Handles a socket connection close.
WebTailServer.prototype.socketDisconnectHandler = function (socket) {
    return function () {
        console.log("Client disconnected: " + socket.handshake.address);
    }
}

// Used for creating the client web server.
WebTailServer.prototype.createClientWebServer = function () {
    this.uiapp = this.modules.http.createServer(function (req, res) {
        // Check access token. TODO: Add proper authentication.
        var query = this.modules.url.parse(req.url, true);
        if (!query.query.token || query.query.token !== this.config.client_server.token) {
            res.writeHead(401);
            res.end("Unauthorized");
            return;
        }
        // Method used for handling an incoming request.
        this.fs.readFile(this.config.client_server.index_file_path,
            function (err, data) {
                if (err) {
                    res.writeHead(500);
                    return res.end('Error loading index.html');
                }

                res.writeHead(200);
                res.end(data);
            });
    }.bind(this));
    this.io = this.modules.socketIo(this.uiapp);
    this.fs = this.modules.fs;

    // Bind socket connection handler.
    this.io.on('connection', this.ioConnectionHandler.bind(this));

    // Listen for requests.
    console.log("Creating client listener on port: " + this.config.client_server.port);
    this.uiapp.listen(this.config.client_server.port); // TODO: Handle errors.
}

// Used for creating the agent web server.
WebTailServer.prototype.createAgentWebServer = function () {
    // Prepare express app.
    this.app = this.modules.express();

    // Add middleware for parsing form data.
    this.app.use(this.modules.bodyParser.urlencoded({extended: true}));

    // Register POST route, for incoming tail data.
    console.log("Agents URL: " + this.config.agent_server.url);
    this.app.post(this.config.agent_server.url, function (req, res) {
        // First, verify access token.
        if (!req.query.token || req.query.token !== this.config.agent_server.token) {
            console.log("Invalid access token from agent: " +
                (req.headers['x-forwarded-for'] || req.connection.remoteAddress)
                + ". Request ignored.");
            res.status(401).send("Unauthorized.");
            return;
        }
        // Check input parameters.
        if (typeof req.body.file === "undefined" || typeof req.body.data === "undefined" || typeof req.body.datetime === "undefined") {
            console.log("Invalid data from agent: " +
                (req.headers['x-forwarded-for'] || req.connection.remoteAddress)
                + ", missing post parameter(s). Ignored.");

            // Send an INVALID message.
            res.status(500).send("INVALID");
        } else {
            // Emit 'line' to all sockets.
            this.io.sockets.emit('line', {
                client: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                file: req.body.file,
                data: req.body.data,
                datetime: req.body.datetime
            });

            // Send an OK message.
            res.send("OK");
        }
    }.bind(this));

    // Finally, create agent listener.
    console.log("Creating tail agent listener on port: " + this.config.agent_server.port);
    this.app.listen(this.config.agent_server.port); // TODO: Handle errors.
}

// Read the ini configuration file, and stores it in this.config.
WebTailServer.prototype.readConfiguration = function () {
    try {
        this.config = this.modules.ini.parse(this.modules.fs.readFileSync(this.configFileName, 'utf-8'));
    } catch (Exception) {
        if (Exception.errno === 34) {
            console.log("Can not read configuration file: " + Exception.path + ". Process terminated.");
            process.exit(1);
        } else {
            throw Exception;
        }
    }
}

// Default configuration file path.
var configurationFilePath = "configuration.ini";

// Check if a command line configuration file path is used.
if (process.argv.length === 3) {
    // If so, overwrite the default configuration file path.
    configurationFilePath = process.argv[2];
}

new WebTailServer(configurationFilePath);