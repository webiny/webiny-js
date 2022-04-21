const { createElasticsearchClient } = require("../../../api-elasticsearch/src/client");

const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || 9200;
const awsDomain = process.env.AWS_ELASTIC_SEARCH_DOMAIN_NAME;

const defaultOptions = {
    node: `http://localhost:${ELASTICSEARCH_PORT}`,
    auth: {},
    maxRetries: 10,
    pingTimeout: 500
};
if (process.env.LOCAL_ELASTICSEARCH !== "true") {
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
