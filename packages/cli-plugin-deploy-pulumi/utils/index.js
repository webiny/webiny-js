const createProjectApplicationWorkspace = require("./createProjectApplicationWorkspace");
const getPulumi = require("./getPulumi");
const getStackOutput = require("./getStackOutput");
const processHooks = require("./processHooks");
const notify = require("./notify");
const login = require("./login");
const mapStackOutput = require("./mapStackOutput");
const getRandomColorForString = require("./getRandomColorForString");

module.exports = {
    getPulumi,
    getStackOutput,
    mapStackOutput,
    processHooks,
    notify,
    login,
    getRandomColorForString,
    createProjectApplicationWorkspace
};
