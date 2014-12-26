This module provides logic for persisting tail data into elasticsearch.

To enable it add the following configuration entry to your configuration file, in the [plugins] key.

plugin[] = 'elastricsearch'

This module expects the following configuration values to be made available:

[elasticsearch]

Configuration keys are passed in to elasticsearch's module Client function. As such, configuration values
should be made of parameters for this function as documented here:
http://www.elasticsearch.org/guide/en/elasticsearch/client/javascript-api/current/configuration.html

Update your package.json file, and add the following dependency:

"elasticsearch": ""

For instructions on how to install elastic search, see:
http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/setup-repositories.html