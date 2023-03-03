const { createBuildFunction } = require("@webiny/project-utils");

module.exports = {
    commands: {
        buildDdb: createBuildFunction({
            cwd: __dirname,
            overrides: {
                entry: "src/ddb.ts",
                output: {
                    path: __dirname + "/dist/ddb",
                    filename: "index.js"
                }
            }
        }),
        buildDdbEs: createBuildFunction({
            cwd: __dirname,
            overrides: {
                entry: "src/ddb-es.ts",
                output: {
                    path: __dirname + "/dist/ddb-es",
                    filename: "index.js"
                }
            }
        })
    }
};
