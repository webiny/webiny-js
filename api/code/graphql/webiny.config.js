const { buildFunction } = require("@webiny/project-utils");

process.env.WEBINY_VERSION="5.0.0-beta.5"

module.exports = {
    commands: {
        build: buildFunction
    }
};
