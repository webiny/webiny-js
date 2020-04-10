const getEnvironment = require("./getEnvironment");

/**
 * Returns site's Bucket and file's Key values.
 * @param filename
 * @returns {{Bucket: string, Key: string}}
 */
module.exports = filename => {
    const { bucket: Bucket } = getEnvironment();

    return {
        Bucket,
        Key: `${filename}`
    };
};
