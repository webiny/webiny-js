const { lambda } = require("webiny-api");
const { default: api } = require("./api");

module.exports.handler = lambda(api);
