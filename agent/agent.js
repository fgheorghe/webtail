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
var WebTailAgent = function(configFileName) {
    this.configFileName = configFileName;
    this.init();
};

// Initializes the application, by loading dependencies and
// triggering the tail process for configured files.
WebTailAgent.prototype.init = function() {
    // Load required modules.
    this.modules = {
        tail: require('tail').Tail,
        http: require('http'),
        fs: require('fs'),
        ini: require('ini'),
        request: require('request'),
        moment: require('moment')
    };

    // Load configuration.
    this.readConfiguration();

    // Start tailing all configured files.
    this.tail();
}

// Pushes data to master server, for a given file.
WebTailAgent.prototype.pushDataToServer = function(file, data) {
    this.modules.request.post(this.config.server.url + '?token=' + this.config.server.token, {
        form: {
            file: file,
            data: data,
            datetime: this.modules.moment().format('YYYY-MM-DD HH:mm:ss Z')
        }
    }, function(error, response) {
        // Handle errors.
        if (error || !response || (typeof response !== "undefined" && response.statusCode !== 200)) {
            if (error) {
                console.log("Can not push data to server. Reason: " + JSON.stringify(error));
            } else if (typeof response !== "undefined" && response.statusCode !== 200) {
                console.log("Can not push data to server. Http status code: " + response.statusCode);
            }
        }
    } );
}

// Creates 'line' event listener for a file.
WebTailAgent.prototype.tailLineEventListener = function(file) {
    return function(data) {
        // Push data to server.
        this.pushDataToServer(file, data);
    }
}

// Tails files.
WebTailAgent.prototype.tail = function() {
    var i, tail = [], _tail;
    // Check if there is anything to tail.
    if (!this.config.tail.file.length) {
        console.log("No files to tail. Process terminated.");
        process.exit(1);
    }

    // Create tail instance for each file.
    for (i = 0; i < this.config.tail.file.length; i++) {
        try {
            // Temporarily store file.
            _tail = new this.modules.tail(this.config.tail.file[i]);
            console.log("Tailing file: " + this.config.tail.file[i]);
            // Bind events.
            _tail.on("line", this.tailLineEventListener(this.config.tail.file[i]).bind(this));
            // Store in array.
            tail.push(_tail);
        } catch (Exception) {
            if (Exception.errno === 34) {
                console.log("Can not read tail file: " + Exception.path + ". Process terminated." );
                process.exit(1);
            } else {
                throw Exception;
            }
        }
    }
}

// Read the ini configuration file, and stores it in this.config.
WebTailAgent.prototype.readConfiguration = function() {
    try {
        this.config = this.modules.ini.parse(this.modules.fs.readFileSync(this.configFileName, 'utf-8'));
    } catch (Exception) {
        if (Exception.errno === 34) {
            console.log("Can not read configuration file: " + Exception.path + ". Process terminated." );
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

// Start the application.
new WebTailAgent(configurationFilePath);