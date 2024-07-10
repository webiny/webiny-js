const createBuildFunction = require("./createBuildFunction");
const fs = require("fs");
const rimraf = require("rimraf");
const { join } = require("path");

module.exports = async options => {
    const start = new Date();

    const { cwd } = options;

    options.logs !== false && console.log("Deleting existing build files...");
    rimraf.sync(join(cwd, "./dist"));
    rimraf.sync(join(cwd, "*.tsbuildinfo"), { glob: true });

    await createBuildFunction({
        ...options,
        overrides: {
            output: { filename: "handler.js", path: join(cwd, "dist") }
        }
    })();

    options.logs !== false && console.log("Copying meta files...");
    copyToDist("package.json", options);
    copyToDist("LICENSE", options);
    copyToDist("README.md", options);

    const duration = (new Date() - start) / 1000;
    options.logs !== false && console.log(`Done! Build finished in ${duration + "s"}.`);

    return { duration };
};

const copyToDist = (path, { cwd, logs }) => {
    const from = join(cwd, path);
    const to = join(cwd, "dist", path);
    if (fs.existsSync(from)) {
        fs.copyFileSync(from, to);
        logs !== false && console.log(`Copied ${path}.`);
    }
};
