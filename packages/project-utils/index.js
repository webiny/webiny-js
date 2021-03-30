const { buildFunction, watchFunction } = require("./bundling/function");
const { startApp, buildApp } = require("./bundling/app");

module.exports = {
    buildApp,
    startApp,
    buildFunction,
    watchFunction
};
