const { buildFunction, watchFunction } = require("./bundling/function");
const { startApp, buildApp } = require("./bundling/app");
const {
    createWatchPackage,
    watchPackage,
    createBuildPackage,
    buildPackage
} = require("./packages");
const { traverseLoaders } = require("./traverseLoaders");

module.exports = {
    buildApp,
    startApp,
    buildFunction,
    watchFunction,
    watchPackage,
    createWatchPackage,
    buildPackage,
    createBuildPackage,
    traverseLoaders
};
