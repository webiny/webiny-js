const { startApp, buildApp, buildAppHandler } = require("@webiny/project-utils");

module.exports = {
    commands: {
        async start(...args) {
            // Start local development
            await startApp(...args);
        },
        async build(...args) {
            // Bundle app for deployment
            await buildApp(...args);
            // Build Lambda handler which will serve files to CDN
            await buildAppHandler(...args);
        }
    }
};
