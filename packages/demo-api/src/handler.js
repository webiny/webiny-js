// @flow
const { lambda } = require("webiny-api");
const { default: api } = require("./api");
const { default: files } = require("./files");

module.exports.api = lambda(api);
module.exports.files = files;
