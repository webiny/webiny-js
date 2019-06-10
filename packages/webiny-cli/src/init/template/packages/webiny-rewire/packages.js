const { sep } = require("path");

// Get all workspaces
const packages = require("get-yarn-workspaces")();

// Make package paths cross-platform ("get-yarn-workspaces" is always returning forward slashes)
module.exports = packages.map(p => p.replace(/\//g, sep));
