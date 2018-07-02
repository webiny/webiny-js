// @flow
const baseConfig = require("./config.base");
const listPackages = require("./../utils/listPackages");

// Create a module map to point React packages to the build output
const moduleNameMapper = {};
listPackages().forEach(name => {
    // Named entry points
    moduleNameMapper[`^${name}/(.*)$`] = `<rootDir>packages/${name}/src/$1`;
});

module.exports = Object.assign({}, baseConfig, {
    moduleNameMapper
});
