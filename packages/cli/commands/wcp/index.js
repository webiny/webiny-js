const login = require("./login");
const project = require("./project");
const hooks = require("./hooks");

module.exports = [login(), project(), hooks()];
