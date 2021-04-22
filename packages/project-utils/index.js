const { buildFunction, watchFunction } = require("./bundling/function");
const { startApp, buildApp } = require("./bundling/app");
const { watchPackage, buildPackage } = require("./packages");

module.exports = {
    buildApp,
    startApp,
    buildFunction,
    watchFunction,
    watchPackage,
    buildPackage
};
