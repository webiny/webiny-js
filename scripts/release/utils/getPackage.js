const readPkg = require("read-pkg");

/**
 * Get a single package
 * @param config
 * @returns {{name: string, location: string, package}}
 */
module.exports = (config = {}) => {
    const root = config.root || process.cwd();
    const pkg = readPkg.sync(root);
    return {
        name: pkg.name,
        location: root,
        package: pkg
    };
};
