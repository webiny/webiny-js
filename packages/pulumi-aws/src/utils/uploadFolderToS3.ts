import fs from "fs";
import fetch from "node-fetch";
import FormData from "form-data";
import { S3Client, PresignedPostOptions, HeadObjectCommand } from "@webiny/aws-sdk/client-s3";
import mime from "mime";
import chunk from "lodash/chunk";
import { relative } from "path";
import { crawlDirectory } from "./crawlDirectory";
import { getPresignedPost } from "./getPresignedPost";

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

export interface Paths {
    full: string;
    relative: string;
}

export type CacheControls = Array<{
    pattern: RegExp;
    value: string;
}>;

export interface UploadFolderToS3Params {
    // Path to the folder that needs to be uploaded.
    path: string;

    // Object ACL.
    acl: string;

    // A callback that gets called every time a file has been uploaded successfully.
    onFileUploadSuccess: (params: { paths: Paths }) => void;

    // A callback that gets called every time a file has not been uploaded successfully.
    onFileUploadError: (params: { paths: Paths; error: Error }) => void;

    // A callback that gets called every time a file upload has been skipped.
    onFileUploadSkip: (params: { paths: Paths }) => void;

    // Target bucket
    bucket: PresignedPostOptions["Bucket"];

    // Cache control to apply to each uploaded file
    cacheControl?: string | CacheControls;
}

export const uploadFolderToS3 = async ({
    path: root,
    bucket,
    onFileUploadSuccess,
    onFileUploadError,
    onFileUploadSkip,
    // For backwards compatibility, we need to leave ACL on "public-read".
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
                    // We also replace "\" with "/", which is a path separator on Windows' CMD or Powershell.
                    const key = relative(root, path).replace(/\\/g, "/");
                    try {
                        // Get file checksum so that we can check if a file needs to be uploaded or not.
                        const checksum = await getFileChecksum(path);

                        let skipUpload = false;
                        try {
                            const existingObject = await s3.send(
                                new HeadObjectCommand({
                                    Bucket: bucket,
                                    Key: key
                                })
                            );

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
                            const contentType = mime.getType(path);

                            const { url, fields } = await getPresignedPost({
                                bucket,
                                key,
                                acl,
                                checksum,
                                contentType,
                                cacheControl: cacheControl ? cacheControl.value : undefined
                            });

                            const data: Record<string, string | Buffer> = {
                                ...fields,
                                "Content-Type": contentType || "",
                                "X-Amz-Meta-Checksum": checksum,
                                file: fs.readFileSync(path)
                            };

                            if (cacheControl) {
                                data["Cache-Control"] = cacheControl.value;
                            }

                            const formData = new FormData();
                            Object.keys(data).forEach(key => {
                                formData.append(key, data[key]);
                            });

                            const res = await fetch(url, {
                                method: "POST",
                                body: formData
                            });

                            if (res.status > 299) {
                                throw new Error(`${res.statusText}\n${await res.text()}`);
                            }

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
