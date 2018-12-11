// @flowIgnore
const packages = require("../packages");

module.exports = {
    babelrc: true,
    babelrcRoots: packages,
    presets: [__dirname + "/preset"]
};
