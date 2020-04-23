// This file is require for running tests only!!
const { allPackages } = require("@webiny/project-utils/packages");

module.exports = {
    babelrc: true,
    babelrcRoots: allPackages()
};
