const { buildFunction } = require("@webiny/api-file-manager/handlers/transform/bundle");
const { watchFunction } = require("@webiny/project-utils");

module.exports = {
    commands: {
        build: buildFunction,
        watch: watchFunction
    }
};
