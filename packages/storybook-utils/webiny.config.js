const fs = require("fs");
const execa = require("execa");
const { buildPackage } = require("@webiny/project-utils");

module.exports = {
    commands: {
        build: (options, context) => {
            return buildPackage(
                {
                    ...options,
                    postbuild: () => {
                        context.info("Generating TypeScript types...");
                        execa.sync("yarn", ["tsc", "-p", "tsconfig.build.json"], {
                            stdio: "inherit"
                        });

                        context.info("Copying meta files...");
                        fs.copyFileSync("package.json", "./dist/package.json");
                    }
                },
                context
            );
        }
    }
};
