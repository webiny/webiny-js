const getPulumi = require("./getPulumi");
const getStackOutput = require("./getStackOutput");
const crawlDirectory = require("./crawlDirectory");
const processHooks = require("./processHooks");
const notify = require("./notify");
const login = require("./login");
const mapStackOutput = require("./mapStackOutput");
const loadEnvVariables = require("./loadEnvVariables");
const getRandomColorForString = require("./getRandomColorForString");
const { tagResources } = require("./tagResources");

module.exports = {
    getPulumi,
    getStackOutput,
    crawlDirectory,
    loadEnvVariables,
    mapStackOutput,
    tagResources,
    processHooks,
    notify,
    login,
    getRandomColorForString
};
