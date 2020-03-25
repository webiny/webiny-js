const path = require("path");
const projectRoot = process.cwd();

const resolve = (...dir) => {
    return path.resolve(projectRoot, ...dir);
};

const replaceProjectRoot = path => {
    return path.replace(paths.projectRoot, "<projectRoot>").replace(/\\/g, "/");
};

const paths = {
    projectRoot,
    replaceProjectRoot,
    packagesPath: resolve("packages")
};

module.exports.paths = paths;
