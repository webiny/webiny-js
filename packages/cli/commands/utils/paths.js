const path = require("path");
const projectRoot = process.cwd();

const resolve = (...dir) => {
    return path.resolve(projectRoot, ...dir);
};

module.exports.paths = {
    projectRoot,
    packagesPath: resolve("packages"),
    apiPath: resolve("api"),
    appPath: resolve("apps"),
    apiYaml: resolve("api", "serverless.yml"),
    appsYaml: resolve("apps", "serverless.yml")
};
