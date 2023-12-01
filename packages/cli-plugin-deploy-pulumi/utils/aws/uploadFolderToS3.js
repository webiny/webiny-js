const isString = require("lodash/isString");
const fs = require("fs");
const { S3Client } = require("@webiny/aws-sdk/client-s3");
const mime = require("mime");
const chunk = require("lodash/chunk");
const { relative } = require("path");
const { crawlDirectory } = require("..");

function getFileChecksum(file) {
    const crypto = require("crypto");
    const hash = crypto.createHash("md5");

    return new Promise(resolve => {
        const stream = fs.createReadStream(file);
        stream.on("data", function (data) {
            hash.update(data, "utf8");
        });

        stream.on("end", function () {
            resolve(hash.digest("hex"));
        });
    });
}

module.exports = async ({
    path: root,
    bucket,
    onFileUploadSuccess,
    onFileUploadError,
    onFileUploadSkip,
    acl = "public-read",
    cacheControl = "max-age=31536000"
}) => {
    const s3 = new S3Client({ region: process.env.AWS_REGION });

    if (!fs.existsSync(root)) {
        throw new Error("Cannot continue, folder does not exist.");
    }

    const paths = [];

    await crawlDirectory(root, async path => {
        paths.push(path);
    });

    const pathsChunks = chunk(paths, 20);

    if (isString(cacheControl)) {
        cacheControl = [{ pattern: /.*/, value: cacheControl }];
    }

    for (let i = 0; i < pathsChunks.length; i++) {
        const chunk = pathsChunks[i];

        const promises = [];
        for (let j = 0; j < chunk.length; j++) {
            const path = chunk[j];

            promises.push(
                new Promise(async resolve => {
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

                            if (existingObject.Metadata.checksum === checksum) {
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
                            await s3
                                .putObject({
                                    Bucket: bucket,
                                    Key: key,
                                    ACL: acl,
                                    CacheControl: cacheControl.find(x => x.pattern.test(key)).value,
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
