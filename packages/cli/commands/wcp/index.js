const login = require("./login");
const logout = require("./logout");
const whoami = require("./whoami");
const project = require("./project");
const hooks = require("./hooks");

module.exports = [login(), logout(), whoami(), project(), hooks()];
