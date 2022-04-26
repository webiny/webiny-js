const { command: login } = require("./login");
const { command: logout } = require("./logout");
const { command: whoami } = require("./whoami");
const { command: project } = require("./project");

const hooks = require("./hooks");

module.exports = [login(), logout(), whoami(), project(), hooks()];
