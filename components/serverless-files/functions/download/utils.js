const queryString = require("query-string");
const sanitizeFilename = require("sanitize-filename");
const pathLib = require("path");
const { getS3Data } = require("../utils");

/**
 * Based on given path, extracts file key and additional options sent via query params.
 * @param path
 */
export const extractFilenameOptions = path => {
    let filename = path.replace("/files/", "");
    let options = null;

    let queryParams = path.match(/.*?(\?.*)/); // return ?width=123&xyz=abc
    if (queryParams) {
        options = queryString.parse(queryParams[1]);
        filename = sanitizeFilename(filename.replace(queryParams[1], ""));
    }

    return { filename, options, extension: pathLib.extname(filename) };
};

/**
 * Returns S3 Object's public URL. Used by Webiny Proxy Layer to send the file back to client.
 * @param key
 * @returns {string}
 */
export const getObjectUrl = key => {
    const s3 = getS3Data();
    return `https://${s3.bucket}.s3.${s3.region}.amazonaws.com/${key}`;
};

/**
 * Returns site's Bucket and file's Key values.
 * @param filename
 * @returns {{Bucket: string, Key: string}}
 */
export const getObjectParams = filename => {
    const s3 = getS3Data();

    return {
        Bucket: s3.bucket,
        Key: `${filename}`
    };
};

/**
 * Promisifies s3 CRUD object functions, for easier use in processors.
 * Could not promisify using NodeJS "util.promisify" utility function, "this" is lost in the process.
 * @param s3
 * @param action
 * @returns {function({params?: *}): Promise<any>}
 */
export const promisifyS3ObjectFunction = ({ s3, action }) => {
    return async ({ params }) => {
        return new Promise((resolve, reject) => {
            s3[action](params, function(err, data) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(data);
            });
        });
    };
};
