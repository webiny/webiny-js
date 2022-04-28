const { createElasticsearchClient } = require("../../../api-elasticsearch/dist/client");

const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || 9200;
const awsDomain = process.env.AWS_ELASTIC_SEARCH_DOMAIN_NAME;

//const esEndpoint = process.env.ELASTIC_SEARCH_ENDPOINT;

const defaultOptions = {
    node: `http://localhost:${ELASTICSEARCH_PORT}`,
    auth: {},
    maxRetries: 10,
    pingTimeout: 500
};
if (!!awsDomain) {
    defaultOptions.node = awsDomain;
    defaultOptions.auth = undefined;
}

module.exports = {
    createElasticsearchClient: (options = {}) => {
        return createElasticsearchClient({
            ...defaultOptions,
            ...options
        });
    }
};
