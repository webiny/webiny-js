const merge = require("lodash/merge");

/**
 * Prepares the options object, sent to build and watch functions.
 * @param config
 * @param options
 * @returns {Promise<{overrides}|*>}
 */
module.exports.prepareOptions = ({ config, options }) => {
    const mergedOptions = merge({}, config, options);

    // If it doesn't exist, ensure `overrides` is an empty object.
    if (!mergedOptions.overrides) {
        mergedOptions.overrides = {};
    }

    // We want to have logs enabled by default.
    mergedOptions.logs = mergedOptions.logs !== false;

    // We want to have debug logs disabled by default.
    mergedOptions.debug = mergedOptions.debug === true;

    return mergedOptions;
};

/**
 * Calculates time difference between the initial `getDuration`
 * invocation and the invocation of the returned callback function.
 * @returns {function(): string}
 */
module.exports.getDuration = () => {
    const start = new Date();
    return () => {
        return (new Date() - start) / 1000;
    };
};
