// @flow
const baseConfig = require("./config.base");
const listPackages = require("./../utils/listPackages");
const buildPath = require("./../utils/buildPath");

// Create a module map to point React packages to the build output
const moduleNameMapper = {};
listPackages().forEach(name => {
    // Root entry point
    moduleNameMapper[`^${name}$`] = `<rootDir>${buildPath}/${name}`;
    // Named entry points
    moduleNameMapper[`^${name}/(.*)$`] = `<rootDir>${buildPath}/${name}/$1`;
});

module.exports = Object.assign({}, baseConfig, {
    moduleNameMapper
});
