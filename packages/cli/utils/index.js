const { importModule } = require("./importModule");
const getProject = require("./getProject");
const getProjectApplication = require("./getProjectApplication");
const getApiProjectApplicationFolder = require("./getApiProjectApplicationFolder");
const localStorage = require("./localStorage");
const log = require("./log");
const sendEvent = require("./sendEvent");
const PluginsContainer = require("./PluginsContainer");

const noop = () => {
    // Do nothing.
};

module.exports = {
    getApiProjectApplicationFolder,
    getProject,
    getProjectApplication,
    importModule,
    localStorage,
    log,
    noop,
    sendEvent,
    PluginsContainer
};
