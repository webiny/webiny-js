const base = require("../../jest.config.base");

const prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX || "";

process.env.ELASTIC_SEARCH_INDEX_PREFIX = `${prefix}_api-elasticsearch-`;

module.exports = base(
    {
        path: __dirname
    },
    []
);
