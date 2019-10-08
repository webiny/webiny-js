const sanitizeFilename = require("sanitize-filename");
const pathLib = require("path");
const { getEnvironment } = require("../utils");

/**
 * Based on given path, extracts file key and additional options sent via query params.
 * @param event
 */
export const extractFilenameOptions = event => {
    const path = sanitizeFilename(event.pathParameters.path);
    return {
        filename: path,
        options: event.queryStringParameters,
        extension: pathLib.extname(path)
    };
};

export const getObjectParams = filename => {
    const { bucket: Bucket } = getEnvironment();

    return {
        Bucket,
        Key: `${filename}`
    };
};
