const fs = require("fs");
const S3Client = require("aws-sdk/clients/s3");
const mime = require("mime");
const chunk = require("lodash/chunk");
const { relative } = require("path");

module.exports = async ({ path: root, bucket, onFileUploadSuccess, onFileUploadError }) => {
    const s3 = new S3Client({ region: process.env.AWS_REGION });

    if (!fs.existsSync(root)) {
        throw new Error("Cannot continue, folder does not exist.");
    }

    const paths = [];

    await crawlDirectory(root, async path => {
        paths.push(path);
    });

    const pathsChunks = chunk(paths, 20);

    for (let i = 0; i < pathsChunks.length; i++) {
        const chunk = pathsChunks[i];

        const promises = [];
        for (let j = 0; j < chunk.length; j++) {
            const path = chunk[j];

            // We also replace "\" with "/", which can occur on Windows' CMD or Powershell.
            // https://github.com/webiny/webiny-js/issues/1701#issuecomment-860123555
            const key = relative(root, path).replace(/\\/g, "/");

            promises.push(
                new Promise(async resolve => {
                    try {
                        await s3
                            .putObject({
                                Bucket: bucket,
                                Key: key,
                                ACL: "public-read",
                                CacheControl: "max-age=31536000",
                                ContentType: mime.getType(path) || undefined,
                                Body: fs.readFileSync(path)
                            })
                            .promise();

                        if (typeof onFileUploadSuccess === "function") {
                            await onFileUploadSuccess({ paths: { full: path, relative: key } });
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

const crawlDirectory = async (dir, upload) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = `${dir}/${file}`;
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            await crawlDirectory(filePath, upload);
        }

        if (stat.isFile()) {
            await upload(filePath);
        }
    }
};
