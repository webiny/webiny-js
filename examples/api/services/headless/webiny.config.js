const { buildApi } = require("@webiny/project-utils"); // move this to project-utils

module.exports = {
    commands: {
        async build(inputs, context) {
            await buildApi(inputs, context);
        }
    }
};
