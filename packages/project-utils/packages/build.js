const execa = require("execa");
const fs = require("fs");
const rimraf = require("rimraf");

module.exports = async (options = {}, context) => {
    const start = new Date();
    const getDuration = () => {
        return (new Date() - start) / 1000;
    };

    // Defined these withing the main build function just so we can access "context" without forwarding it.
    const defaults = {
        prebuild: () => {
            context.info("Deleting existing build files...");
            rimraf.sync("./dist");
            rimraf.sync("*.tsbuildinfo");
        },
        build: () => {
            context.info("Building...");
            return execa.sync(
                "yarn",
                [
                    "babel",
                    "src",
                    "-d",
                    "dist",
                    "--source-maps",
                    "--copy-files",
                    "--extensions",
                    ".ts,.tsx"
                ],
                {
                    stdio: "inherit"
                }
            );
        },
        postbuild: () => {
            context.info("Generating TypeScript types...");
            execa.sync("yarn", ["tsc", "-p", "tsconfig.build.json"], { stdio: "inherit" });

            context.info("Copying meta files...");
            fs.copyFileSync("package.json", "./dist/package.json");
            fs.copyFileSync("LICENSE", "./dist/LICENSE");
            fs.copyFileSync("README.md", "./dist/README.md");
        }
    };

    const prebuild = options.prebuild || defaults.prebuild;
    if (typeof prebuild === "function") {
        await prebuild(options, context);
    }

    const build = options.build || defaults.build;
    if (typeof build === "function") {
        await build(options, context);
    }

    const postbuild = options.postbuild || defaults.postbuild;
    if (typeof postbuild === "function") {
        await postbuild(options, context);
    }

    context.info(`Done! Build finished in ${getDuration() + "s"}.`);
};
