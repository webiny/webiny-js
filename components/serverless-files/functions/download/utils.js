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

/**
 * Returns S3 Object's public URL. Used by Webiny Proxy Layer to send the file back to client.
 * @param key
 * @returns {string}
 */
export const getObjectUrl = key => {
    const { bucket, region } = getEnvironment();
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};

/**
 * Returns site's Bucket and file's Key values.
 * @param filename
 * @returns {{Bucket: string, Key: string}}
 */
export const getObjectParams = filename => {
    const { bucket: Bucket } = getEnvironment();

    return {
        Bucket,
        Key: `${filename}`
    };
};
