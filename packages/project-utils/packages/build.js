const execa = require("execa");
const fs = require("fs");
const rimraf = require("rimraf");
const { join } = require("path");
const { log } = require("@webiny/cli/utils");

module.exports = async (options = {}, context) => {
    const start = new Date();
    const getDuration = () => {
        return (new Date() - start) / 1000;
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

    log.info(`Done! Build finished in ${log.info.hl(getDuration() + "s")}.`);
};

const defaults = {
    prebuild: () => {
        log.info("Deleting existing build files...");
        rimraf.sync("./dist");
        rimraf.sync("*.tsbuildinfo");
    },
    build: () => {
        log.info("Building...");
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
        // Check if `ttypescript` is defined as a devDependency and use that instead of `typescript`.
        const pkg = require(join(process.cwd(), "package.json"));
        log.info("Generating TypeScript types...");
        const binary = "ttypescript" in (pkg.devDependencies || {}) ? "ttsc" : "tsc";
        execa.sync("yarn", [binary, "-p", "tsconfig.build.json"], { stdio: "inherit" });

        log.info("Copying meta files...");
        copyToDist("package.json");
        copyToDist("LICENSE");
        copyToDist("README.md");
    }
};

const copyToDist = path => {
    if (fs.existsSync(path)) {
        fs.copyFileSync(path, join(".", "dist", path));
        log.info(`Copied ${log.info.hl(path)}.`);
    }
};
