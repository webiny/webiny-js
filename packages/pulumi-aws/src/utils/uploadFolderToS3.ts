import fs from "fs";
import S3Client from "aws-sdk/clients/s3";
import mime from "mime";
import chunk from "lodash/chunk";
import { relative } from "path";
import { crawlDirectory } from "./crawlDirectory";

function getFileChecksum(file: string): Promise<string> {
    const crypto = require("crypto");
    const hash = crypto.createHash("md5");

    return new Promise(resolve => {
        const stream = fs.createReadStream(file);
        stream.on("data", function (data: any) {
            hash.update(data, "utf8");
        });

        stream.on("end", function () {
            resolve(hash.digest("hex"));
        });
    });
}

import { BucketName, ObjectCannedACL, CacheControl } from "aws-sdk/clients/s3";

export interface Paths {
    full: string;
    relative: string;
}

type CacheControls = Array<{ pattern: RegExp; value: CacheControl }>;

export interface UploadFolderToS3Params {
    // Path to the folder that needs to be uploaded.
    path: string;

    // A callback that gets called every time a file has been uploaded successfully.
    onFileUploadSuccess: (params: { paths: Paths }) => void;

    // A callback that gets called every time a file has not been uploaded successfully.
    onFileUploadError: (params: { paths: Paths; error: Error }) => void;

    // A callback that gets called every time a file upload has been skipped.
    onFileUploadSkip: (params: { paths: Paths }) => void;

    bucket: BucketName;
    acl?: ObjectCannedACL;
    cacheControl?: CacheControl | CacheControls;
}

export const uploadFolderToS3 = async ({
    path: root,
    bucket,
    onFileUploadSuccess,
    onFileUploadError,
    onFileUploadSkip,
    acl = "public-read",
    cacheControl = "max-age=31536000"
}: UploadFolderToS3Params) => {
    const s3 = new S3Client({ region: process.env.AWS_REGION });

    if (!fs.existsSync(root)) {
        throw new Error("Cannot continue, folder does not exist.");
    }

    const paths: string[] = [];

    await crawlDirectory(root, async (path: string) => {
        paths.push(path);
    });

    const pathsChunks = chunk(paths, 20);

    const cacheControls: CacheControls = [];
    if (typeof cacheControl === "string") {
        cacheControls.push({ pattern: /.*/, value: cacheControl });
    } else if (Array.isArray(cacheControls)) {
        cacheControls.push(...cacheControl);
    }

    for (let i = 0; i < pathsChunks.length; i++) {
        const chunk = pathsChunks[i];

        const promises = [];
        for (let j = 0; j < chunk.length; j++) {
            const path = chunk[j];

            promises.push(
                new Promise<void>(async resolve => {
                    // We also replace "\" with "/", which can occur on Windows' CMD or Powershell.
                    // https://github.com/webiny/webiny-js/issues/1701#issuecomment-860123555
                    const key = relative(root, path).replace(/\\/g, "/");
                    try {
                        // Get file checksum so that we can check if a file needs to be uploaded or not.
                        const checksum = await getFileChecksum(path);

                        let skipUpload = false;
                        try {
                            const existingObject = await s3
                                .headObject({
                                    Bucket: bucket,
                                    Key: key
                                })
                                .promise();

                            if (existingObject.Metadata?.checksum === checksum) {
                                skipUpload = true;
                            }
                        } catch {
                            // Do nothing.
                        }

                        if (skipUpload) {
                            if (typeof onFileUploadSkip === "function") {
                                await onFileUploadSkip({ paths: { full: path, relative: key } });
                            }
                        } else {
                            const cacheControl = cacheControls.find(item => item.pattern.test(key));

                            await s3
                                .putObject({
                                    Bucket: bucket,
                                    Key: key,
                                    ACL: acl,
                                    CacheControl: cacheControl?.value,
                                    ContentType: mime.getType(path) || undefined,
                                    Body: fs.readFileSync(path),
                                    Metadata: {
                                        checksum
                                    }
                                })
                                .promise();

                            if (typeof onFileUploadSuccess === "function") {
                                await onFileUploadSuccess({ paths: { full: path, relative: key } });
                            }
                        }
                        resolve();
                    } catch (e) {
                        if (typeof onFileUploadError === "function") {
                            await onFileUploadError({
                                paths: { full: path, relative: key },
                                error: e
                            });
                        }
                        resolve();
                    }
                })
            );
        }

        await Promise.all(promises);
    }
};
