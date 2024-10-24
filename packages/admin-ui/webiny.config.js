const { createWatchPackage, createBuildPackage } = require("@webiny/project-utils");
const path = require("path");
const fs = require("node:fs");

module.exports = {
    commands: {
        build: async (options, context) => {
            await createBuildPackage({ cwd: __dirname })(options, context);
            {
                const from = path.join(__dirname, "tailwind.config.js");
                const to = path.join(__dirname, "dist/tailwind.config.js");
                fs.cpSync(from, to);
            }
            {
                const from = path.join(__dirname, "tailwind.config.customizations.js");
                const to = path.join(__dirname, "dist/tailwind.config.customizations.js");
                fs.cpSync(from, to);
            }
        },
        watch: createWatchPackage({ cwd: __dirname })
    }
};
