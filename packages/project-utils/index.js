const { startApp, buildApp } = require("./bundling/app");
const { createBuildFunction, createWatchFunction } = require("./bundling/function");
const { createWatchPackage, createBuildPackage } = require("./packages");
const { traverseLoaders } = require("./traverseLoaders");

module.exports = {
    buildApp,
    startApp,

    // Functions.
    createBuildFunction,
    createWatchFunction,

    // Packages.
    createWatchPackage,
    createBuildPackage,

    // Other.
    traverseLoaders
};
