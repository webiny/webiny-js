const { command: login } = require("./login");
const { command: logout } = require("./logout");
const { command: whoami } = require("./whoami");
const { command: project } = require("./project");

const hooks = require("./hooks");
const aaclHooks = require("./aaclHooks");

module.exports = [
    login(),
    logout(),
    whoami(),
    project(),
    hooks(),
    aaclHooks() // Must be after the hooks() call.
];
