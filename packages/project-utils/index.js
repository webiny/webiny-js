const { buildFunction, watchFunction } = require("./bundling/function");
const { startApp, buildApp } = require("./bundling/app");
const { watchPackage, buildPackage } = require("./packages");
const { traverseLoaders } = require("./traverseLoaders");

module.exports = {
    buildApp,
    startApp,
    buildFunction,
    watchFunction,
    watchPackage,
    buildPackage,
    traverseLoaders
};
