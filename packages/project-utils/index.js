const { buildFunction } = require("./bundling/function");
const { startApp, buildApp } = require("./bundling/app");

module.exports = {
    buildApp,
    startApp,
    buildFunction
};
