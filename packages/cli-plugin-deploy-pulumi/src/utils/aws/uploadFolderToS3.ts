import isString from "lodash/isString";
import chunk from "lodash/chunk";
import fs from "fs";
import type { ObjectCannedACL, PutObjectCommandInput } from "@webiny/aws-sdk/client-s3";
import { createS3, HeadObjectCommand, PutObjectCommand } from "@webiny/aws-sdk/client-s3";
import mime from "mime";
import { relative } from "path";
import { crawlDirectory } from "../crawlDirectory";
import crypto from "crypto";

function getFileChecksum(file: string): Promise<string> {
    const hash = crypto.createHash("md5");

    return new Promise<string>(resolve => {
        const stream = fs.createReadStream(file);
        stream.on("data", function (data) {
            const value = typeof data === "string" ? data : data.toString("utf8");
            hash.update(value, "utf8");
        });

        stream.on("end", function () {
            resolve(hash.digest("hex"));
        });
    });
}

export interface Paths {
    full: string;
    relative: string;
}

export interface CacheControlMap {
    [key: string]: PutObjectCommandInput["CacheControl"];
}

export interface IUploadFolderToS3Params {
    // Path to the folder that needs to be uploaded.
    path: string;
    // A callback that gets called every time a file has been uploaded successfully.
    onFileUploadSuccess: (params: { paths: Paths }) => void;
    // A callback that gets called every time a file has not been uploaded successfully.
    onFileUploadError: (params: { paths: Paths; error: Error }) => void;
    // A callback that gets called every time a file upload has been skipped.
    onFileUploadSkip: (params: { paths: Paths }) => void;
    bucket: PutObjectCommandInput["Bucket"];
    acl?: ObjectCannedACL;
    cacheControl?: PutObjectCommandInput["CacheControl"] | CacheControlMap;
}

/**
 * TODO @adrian
 * This is not used anywhere.
 */
export const uploadFolderToS3 = async ({
    path: root,
    bucket,
    onFileUploadSuccess,
    onFileUploadError,
    onFileUploadSkip,
    acl = "public-read",
    cacheControl: initialCacheControl = "max-age=31536000"
}: IUploadFolderToS3Params) => {
    const s3 = createS3({
        region: process.env.AWS_REGION
    });

    if (!fs.existsSync(root)) {
        throw new Error("Cannot continue, folder does not exist.");
    }

    const paths: string[] = [];

    await crawlDirectory(root, async path => {
        paths.push(path);
    });

    const pathsChunks = chunk(paths, 20);

    let cacheControl: CacheControlMap[] = [];

    if (isString(cacheControl)) {
        /**
         * TODO @adrian
         *
         * pattern should be a string.
         * Left it here for now.
         */
        // @ts-expect-error
        cacheControl = [{ pattern: /.*/, value: cacheControl as string }];
    } else {
        cacheControl = initialCacheControl as unknown as CacheControlMap[];
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
                            const cmd = new HeadObjectCommand({
                                Bucket: bucket,
                                Key: key
                            });
                            const existingObject = await s3.send(cmd);

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
                            /**
                             * TODO @adrian
                             *
                             * Check the cache control here.
                             */
                            let cmdCacheControl: string | undefined;
                            if (cacheControl.length) {
                                cmdCacheControl = cacheControl.find(x =>
                                    // @ts-expect-error
                                    x?.pattern?.test(key)
                                )?.value;
                            }
                            const cmd = new PutObjectCommand({
                                Bucket: bucket,
                                Key: key,
                                ACL: acl,
                                CacheControl: cmdCacheControl,
                                ContentType: mime.getType(path) || undefined,
                                Body: fs.readFileSync(path),
                                Metadata: {
                                    checksum
                                }
                            });
                            await s3.send(cmd);

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
