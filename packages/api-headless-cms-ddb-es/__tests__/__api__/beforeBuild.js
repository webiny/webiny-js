const path = require("path");
/**
 * @param {{package: {path: string}, name: string, presets: Array}} item
 */
module.exports = item => {
    process.env.JEST_DYNALITE_CONFIG_DIRECTORY = path.resolve(item.package.path);
};
