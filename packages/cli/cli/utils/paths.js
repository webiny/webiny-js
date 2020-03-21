const path = require("path");
const projectRoot = process.cwd();

const resolve = (...dir) => {
    return path.resolve(projectRoot, ...dir);
};

const paths = {
    projectRoot,
    replaceProjectRoot: path => path.replace(paths.projectRoot, "<projectRoot>"),
    packagesPath: resolve("packages"),
    apiPath: resolve("api"),
    appPath: resolve("apps"),
    apiYaml: resolve("api", "serverless.yml"),
    appsYaml: resolve("apps", "serverless.yml")
};

module.exports.paths = paths;
