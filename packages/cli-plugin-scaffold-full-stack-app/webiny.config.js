const util = require("util");
const fs = require("fs");
const execa = require("execa");
const { watchPackage, buildPackage } = require("@webiny/project-utils");
const ncpBase = require("ncp");
const ncp = util.promisify(ncpBase.ncp);

module.exports = {
    commands: {
        watch: watchPackage,
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
                        fs.copyFileSync("LICENSE", "./dist/LICENSE");
                        fs.copyFileSync("README.md", "./dist/README.md");

                        return ncp("templates", "./dist/templates");
                    }
                },
                context
            );
        }
    }
};
