// @flow
const S3 = require("aws-sdk/clients/s3");
const sanitizeFilename = require("sanitize-filename");
const pathLib = require("path");
const { createHandler, getEnvironment, getObjectParams } = require("../utils");
const loaders = require("./../loaders");

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

const getS3Object = async event => {
    const { region } = getEnvironment();
    const s3 = new S3({ region });

    const { options, filename, extension } = extractFilenameOptions(event);

    for (let i = 0; i < loaders.length; i++) {
        let loader = loaders[i];
        const canProcess = loader.canProcess({
            s3,
            options,
            file: {
                name: filename,
                extension
            }
        });

        if (canProcess) {
            return loader.process({
                s3,
                options,
                file: {
                    name: filename,
                    extension
                }
            });
        }
    }

    // If no processors handled the file request, just return the S3 object by default.
    const params = getObjectParams(filename);
    return s3.getObject(params).promise();
};

module.exports.handler = createHandler(async event => {
    const s3Object = await getS3Object(event);
    return {
        data: s3Object.Body,
        headers: {
            "Content-Type": s3Object.ContentType
        }
    };
});
