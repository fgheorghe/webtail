// Prepare dependencies.
var elasticsearch = require('elasticsearch');

// Stores configuration, passed on to the Client method of the elasticsearch module.
// Expected values are as per:
// http://www.elasticsearch.org/guide/en/elasticsearch/client/javascript-api/current/configuration.html
var config;

// Stores the client.
var client;

// Stores an instance of the server.
var serverInstance;

// Loads module specific configuration.
function loadModuleConfiguration() {
    // Check if configuration is available.
    if (typeof serverInstance.config.elasticsearch === "undefined") {
        console.log("Can not load 'elasticsearch' plugin configuration. Process terminated.");
        process.exit(1);
    }
    config = serverInstance.config.elasticsearch;
}

// Creates an elastic search client.
function createClient() {
    client = new elasticsearch.Client(config);
}

// Instantiates the module.
module.exports = function(server) {
    // Store the server instance.
    serverInstance = server;

    // Initialise plugin.
    loadModuleConfiguration();

    // ...and create the client.
    createClient();

    // Return event handlers.
    return {
            // Agent specific event handlers.
            agent: {
                // Handles incoming line data.
                onLine: function(request) {
                    // TODO: Implement.
                }
        }
    }
};