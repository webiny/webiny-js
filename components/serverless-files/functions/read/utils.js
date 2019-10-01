import queryString from "query-string";
import sanitizeFilename from "sanitize-filename";
import { default as pathLib } from "path";
import type { SiteDataType } from "webiny-proxy-files/types";

/**
 * Based on given path, extracts file key and additional options sent via query params.
 * @param path
 */
export const extractFilenameOptions = (path: string): { key: string, options: ?Object } => {
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
 * @param site
 * @param key
 * @returns {string}
 */
export const getObjectUrl = (site: SiteDataType, key: string) => {
    return `https://${site.uploadsFolder.bucket}.s3.${site.region}.amazonaws.com/${key}`;
};

/**
 * Returns site's Bucket and file's Key values.
 * @param site
 * @param filename
 * @returns {{Bucket: string, Key: string}}
 */
export const getObjectParams = (site: SiteDataType, filename: string) => {
    const output = {
        Bucket: site.uploadsFolder.bucket,
        Key: `${site.uploadsFolder.paths.relative}/${filename}`
    };

    if (output.Key.startsWith("/")) {
        output.Key = output.Key.substr(1);
    }

    return output;
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
