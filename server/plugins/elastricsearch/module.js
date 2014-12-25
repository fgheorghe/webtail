// Stores an instance of the server.
var serverInstance;

// Loads module specific configuration.
function loadModuleConfiguration() {
    // Check if configuration is available.
    if (typeof serverInstance.config.elasticsearch === "undefined") {
        console.log("Can not load 'elasticsearch' plugin configuration. Process terminated.");
        process.exit(1);
    }
}

// Instantiates the module.
module.exports = function(server) {
    // Store the server instance.
    serverInstance = server;

    // Initialise plugin.
    loadModuleConfiguration();

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