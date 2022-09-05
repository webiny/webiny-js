const watchPackage = require("./watchPackage");
const createWatchPackage = require("./createWatchPackage");
const buildPackage = require("./buildPackage");
const createBuildPackage = require("./createBuildPackage");
const createBabelConfigForNode = require("./createBabelConfigForNode");
const createBabelConfigForReact = require("./createBabelConfigForReact");

module.exports = {
    createWatchPackage,
    createBuildPackage,
    watchPackage,
    buildPackage,
    createBabelConfigForNode,
    createBabelConfigForReact
};
