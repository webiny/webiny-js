const path = require("path");

module.exports = require("get-yarn-workspaces")().map(pkg => path.join(...pkg.split("/")));
