const buildPackage = require("./buildPackage");

module.exports =
    config =>
    async (options = {}, context) => {
        return buildPackage({ options, config, context });
    };
