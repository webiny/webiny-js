const { sep } = require("path");

// Get all workspaces
const packages = require("get-yarn-workspaces")();

// This is required to make package paths cross-platform ("get-yarn-workspaces" is always returning forward slashes)
module.exports = packages.map(p => p.replace(/\//g, sep));
