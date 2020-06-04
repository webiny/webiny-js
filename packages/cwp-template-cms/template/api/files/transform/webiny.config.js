const { buildFunction } = require("@webiny/serverless-files/functions/transform/bundle");

module.exports = {
    commands: {
        build: buildFunction
    }
};
