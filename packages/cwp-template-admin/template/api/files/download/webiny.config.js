const { buildFunction } = require("@webiny/serverless-files/functions/download/bundle");

module.exports = {
    commands: {
        build: buildFunction
    }
};
