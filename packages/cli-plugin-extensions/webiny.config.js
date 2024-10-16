const fs = require("node:fs/promises");
const path = require("path");

const { createWatchPackage, createBuildPackage } = require("@webiny/project-utils");

module.exports = {
    commands: {
        build: async (options, context) => {
            await createBuildPackage({ cwd: __dirname })(options, context);
            const from = path.join(__dirname, "templates");
            const to = path.join(__dirname, "dist/templates");
            await fs.cp(from, to, { recursive: true });
        },
        watch: createWatchPackage({ cwd: __dirname })
    }
};
