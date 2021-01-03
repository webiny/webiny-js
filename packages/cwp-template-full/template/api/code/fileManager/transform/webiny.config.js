const { buildFunction } = require("@webiny/api-file-manager/handlers/transform/bundle");

module.exports = {
    commands: {
        build: buildFunction
    }
};
