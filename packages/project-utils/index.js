const { createWatchApp, createBuildApp } = require("./bundling/app");
const { createBuildFunction, createWatchFunction } = require("./bundling/function");
const { createWatchPackage, createBuildPackage } = require("./packages");
const { traverseLoaders } = require("./traverseLoaders");

module.exports = {
    createBuildApp,
    createWatchApp,

    // Functions.
    createBuildFunction,
    createWatchFunction,

    // Packages.
    createWatchPackage,
    createBuildPackage,

    // Other.
    traverseLoaders
};
