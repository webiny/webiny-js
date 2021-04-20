const { buildFunction, watchFunction } = require("@webiny/project-utils");

module.exports = {
    commands: {
        build: buildFunction,
        watch: watchFunction
    }
};
