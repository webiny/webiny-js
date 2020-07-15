const aws = require("aws-sdk");
const fs = require("fs");
const path = require("path");
const klawSync = require("klaw-sync");
const mime = require("mime-types");
const UploadStream = require("s3-stream-upload");
const { isEmpty } = require("ramda");
const { createReadStream } = require("fs-extra");
const archiver = require("archiver");
const { utils } = require("@serverless/core");
const pRetry = require("p-retry");
const { green } = require("chalk");

const PRETRY_ARGS = { retries: 3 };

const getClients = region => {
    const params = { region };

    // we need two S3 clients because creating/deleting buckets
    // is not available with the acceleration feature.
    return {
        regular: new aws.S3(params),
        accelerated: new aws.S3({ ...params, endpoint: `s3-accelerate.amazonaws.com` })
    };
};

const bucketCreation = async (s3, Bucket) => {
    try {
        await s3.headBucket({ Bucket }).promise();
    } catch (e) {
        if (e.code === "NotFound" || e.code === "NoSuchBucket") {
            await utils.sleep(2000);
            return bucketCreation(s3, Bucket);
        }
        throw new Error(e);
    }
};

const ensureBucket = async (s3, name, debug) => {
    try {
        debug(`Checking if bucket ${name} exists.`);
        await s3.headBucket({ Bucket: name }).promise();
    } catch (e) {
        if (e.code === "NotFound") {
            debug(`Bucket ${name} does not exist. Creating...`);
            try {
                await s3.createBucket({ Bucket: name }).promise();
                // there's a race condition when using acceleration
                // so we need to sleep for a couple seconds.
                debug(`Bucket ${name} created. Confirming it's ready...`);
                await bucketCreation(s3, name);
                debug(`Bucket ${name} creation confirmed.`);
            } catch (e) {
                if (e.code === "OperationAborted") {
                    console.log(
                        [
                            "",
                            `🚨 Unable to create bucket! If you have recently deleted a bucket, it will take some time before you can use the same bucket name.`,
                            `You can either wait, or use a different bucket name by updating the ${green(
                                "S3_BUCKET"
                            )} variable.`,
                            ""
                        ].join("\n")
                    );
                    process.exit(1);
                }
            }
        } else if (e.code === "Forbidden" && e.message === null) {
            throw Error(
                `Forbidden: Invalid credentials or this AWS S3 bucket name may already be taken`
            );
        } else if (e.code === "Forbidden") {
            throw Error(`Bucket name "${name}" is already taken.`);
        } else {
            throw e;
        }
    }
};

const uploadDir = async (s3, bucketName, dirPath, cacheControl, options) => {
    const items = await new Promise((resolve, reject) => {
        try {
            resolve(klawSync(dirPath));
        } catch (error) {
            reject(error);
        }
    });

    const uploadItems = [];
    items.forEach(item => {
        if (item.stats.isDirectory()) {
            return;
        }

        let key = path.relative(dirPath, item.path);

        if (options.keyPrefix) {
            key = path.posix.join(options.keyPrefix, key);
        }

        // convert backslashes to forward slashes on windows
        if (path.sep === "\\") {
            key = key.replace(/\\/g, "/");
        }

        const itemParams = {
            Bucket: bucketName,
            Key: key,
            Body: fs.readFileSync(item.path),
            ContentType: mime.lookup(path.basename(item.path)) || "application/octet-stream",
            CacheControl: cacheControl
        };

        uploadItems.push(s3.upload(itemParams).promise());
    });

    await Promise.all(uploadItems);
};

const packAndUploadDir = async ({ s3, bucketName, dirPath, key, append = [], cacheControl }) => {
    const ignore = (await utils.readFileIfExists(path.join(dirPath, ".slsignore"))) || [];
    return new Promise((resolve, reject) => {
        const archive = archiver("zip", {
            zlib: { level: 9 }
        });

        if (!isEmpty(append)) {
            append.forEach(file => {
                const fileStream = createReadStream(file);
                archive.append(fileStream, { name: path.basename(file) });
            });
        }

        archive.glob(
            "**/*",
            {
                cwd: dirPath,
                ignore
            },
            {}
        );

        archive
            .pipe(
                UploadStream(s3, {
                    Bucket: bucketName,
                    Key: key,
                    CacheControl: cacheControl
                })
            )
            .on("error", function(err) {
                return reject(err);
            })
            .on("finish", function() {
                return resolve();
            });

        archive.finalize();
    });
};

const uploadFile = async ({ s3, bucketName, filePath, key, cacheControl }) => {
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(
                UploadStream(s3, {
                    Bucket: bucketName,
                    Key: key,
                    ContentType: mime.lookup(filePath) || "application/octet-stream",
                    CacheControl: cacheControl
                })
            )
            .on("error", function(err) {
                return reject(err);
            })
            .on("finish", function() {
                return resolve();
            });
    });
};

/*
 * Delete Website Bucket
 */

const clearBucket = async (s3, bucketName) => {
    try {
        const data = await s3.listObjects({ Bucket: bucketName }).promise();

        const items = data.Contents;
        const promises = [];

        for (let i = 0; i < items.length; i += 1) {
            const deleteParams = { Bucket: bucketName, Key: items[i].Key };
            const delObj = s3.deleteObject(deleteParams).promise();
            promises.push(delObj);
        }

        await Promise.all(promises);
    } catch (error) {
        if (error.code !== "NoSuchBucket") {
            throw error;
        }
    }
};

const accelerateBucket = async (s3, bucketName, accelerated) => {
    try {
        await pRetry(
            () =>
                s3
                    .putBucketAccelerateConfiguration({
                        AccelerateConfiguration: {
                            Status: accelerated ? "Enabled" : "Suspended"
                        },
                        Bucket: bucketName
                    })
                    .promise(),
            PRETRY_ARGS
        );
    } catch (e) {
        if (e.code === "NoSuchBucket") {
            await utils.sleep(2000);
            return accelerateBucket(s3, bucketName, accelerated);
        }
        throw e;
    }
};

const setNotificationConfiguration = async (s3, bucketName, config) => {
    try {
        await pRetry(
            () =>
                s3
                    .putBucketNotificationConfiguration({
                        Bucket: bucketName,
                        NotificationConfiguration: config
                    })
                    .promise(),
            PRETRY_ARGS
        );
    } catch (err) {
        console.log(err);
        console.log(bucketName, config);
        throw err;
    }
};

const deleteBucket = async (s3, Bucket) => {
    try {
        let Marker = null;
        while (true) {
            const { Contents, IsTruncated } = await s3.listObjects({ Bucket, Marker }).promise();

            if (!Contents.length) {
                break;
            }

            await s3
                .deleteObjects({
                    Bucket,
                    Delete: {
                        Objects: Contents.map(obj => ({ Key: obj.Key }))
                    }
                })
                .promise();

            if (!IsTruncated) {
                break;
            }

            Marker = Contents[Contents.length - 1].Key;
        }

        await s3.deleteBucket({ Bucket }).promise();
    } catch (error) {
        if (error.code !== "NoSuchBucket") {
            throw error;
        }
    }
};

const configureCors = async (s3, bucketName, config) => {
    const params = { Bucket: bucketName, CORSConfiguration: config };
    try {
        await s3.putBucketCors(params).promise();
    } catch (e) {
        if (e.code === "NoSuchBucket") {
            await utils.sleep(2000);
            return configureCors(s3, bucketName, config);
        }
        throw e;
    }
};

module.exports = {
    getClients,
    uploadDir,
    packAndUploadDir,
    uploadFile,
    clearBucket,
    accelerateBucket,
    deleteBucket,
    bucketCreation,
    setNotificationConfiguration,
    ensureBucket,
    configureCors
};
