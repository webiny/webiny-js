// @flow
import S3 from "aws-sdk/clients/s3";
import { imageLoader, defaultLoader } from "./fileLoaders";
import {
    promisifyS3ObjectFunction,
    extractFilenameOptions,
    getObjectUrl,
    getObjectParams
} from "./utils";

import type {
    DownloadFileParamsType,
    DownloadFileResponseType,
    DownloadFileErrorResponseType
} from "webiny-proxy-files/types";

const FILE_FOUND = "FILE_FOUND";
const FILE_NOT_FOUND = "FILE_NOT_FOUND";

/**
 * Loaders are listed here. The "defaultLoader" simply just returns the requested file,
 * and additionally does nothing to it. Leave it as the last item in the loaders array.
 */
const loaders = [imageLoader, defaultLoader];

export const download = async ({
    body: { site, file }
}: {
    body: DownloadFileParamsType
}): DownloadFileResponseType | DownloadFileErrorResponseType => {
    const s3Client = new S3({ region: site.region });
    const s3 = {
        client: s3Client,
        createObject: promisifyS3ObjectFunction({ s3: s3Client, action: "putObject" }),
        deleteObject: promisifyS3ObjectFunction({ s3: s3Client, action: "deleteObject" }),
        getObject: promisifyS3ObjectFunction({ s3: s3Client, action: "getObject" }),
        getObjectUrl: (key: string) => getObjectUrl(site, key),
        getObjectParams: (filename: string) => getObjectParams(site, filename)
    };

    const { filename, options, extension } = extractFilenameOptions(file.path);

    try {
        for (let i = 0; i < loaders.length; i++) {
            let loader = loaders[i];
            if (
                loader.canProcess({
                    s3,
                    site,
                    file: {
                        name: filename,
                        extension
                    },
                    options
                })
            ) {
                return {
                    code: FILE_FOUND,
                    data: await loader.process({
                        site,
                        file: {
                            name: filename,
                            extension
                        },
                        extension,
                        options,
                        s3
                    })
                };
            }
        }
    } catch (e) {
        console.log(
            "Returned error:",
            JSON.stringify({
                code: FILE_NOT_FOUND,
                data: {
                    message: e.message,
                    cloudWatch: {
                        site
                    }
                }
            })
        );

        return {
            code: FILE_NOT_FOUND,
            data: {
                message: e.message
            }
        };
    }
};
