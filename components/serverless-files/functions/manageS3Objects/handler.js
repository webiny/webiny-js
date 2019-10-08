// @flow
const S3 = require("aws-sdk/clients/s3");
const { imageHandler } = require("./fileHandlers");
const { getEnvironment } = require("../utils");
const { extractFilenameOptions } = require("./utils");

const handlers = [imageHandler];

module.exports.handler = async event => {
    console.log('dobeo sam evenat', event)
    const { region } = getEnvironment();
    const s3 = new S3({ region });

    const { options, filename, extension } = extractFilenameOptions(event);

    for (let i = 0; i < handlers.length; i++) {
        let handler = handlers[i];
        const canProcess = handler.canProcess({
            s3,
            options,
            file: {
                name: filename,
                extension
            }
        });

        if (canProcess) {
            await handler.process({
                s3,
                options,
                file: {
                    name: filename,
                    extension
                }
            });

            break;
        }
    }
};
