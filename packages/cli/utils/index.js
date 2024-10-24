const { importModule } = require("./importModule");
const createProjectApplicationWorkspace = require("./createProjectApplicationWorkspace");
const getProject = require("./getProject");
const getProjectApplication = require("./getProjectApplication");
const localStorage = require("./localStorage");
const log = require("./log");
const sendEvent = require("./sendEvent");
const PluginsContainer = require("./PluginsContainer");
const sleep = require("./sleep");
const sleepSync = require("./sleepSync");

const noop = () => {
    // Do nothing.
};

module.exports = {
    createProjectApplicationWorkspace,
    getProject,
    getProjectApplication,
    importModule,
    localStorage,
    log,
    noop,
    sendEvent,
    PluginsContainer,
    sleep,
    sleepSync
};
