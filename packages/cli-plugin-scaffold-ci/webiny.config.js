const { watchPackage, buildPackage } = require("@webiny/project-utils");

module.exports = {
    commands: {
        watch: watchPackage,
        build: buildPackage
    }
};
