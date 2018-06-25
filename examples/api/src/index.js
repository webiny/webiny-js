require("babel-register");

const { lambda } = require("webiny-api");
const { default: app } = require("./app");

module.exports.handler = lambda(app);
