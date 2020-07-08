const { buildFunction } = require("@webiny/serverless-files/functions/manage/bundle");

module.exports = {
    commands: {
        build: buildFunction
    }
};
