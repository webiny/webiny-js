const path = require("path");
const klawSync = require("klaw-sync");
const mime = require("mime-types");
const UploadStream = require("s3-stream-upload");
const fs = require("fs-extra");
const archiver = require("archiver");
const { hashElement } = require("folder-hash");

const { dirname, join } = path;

const resolveFilePath = file => {
    if (file.startsWith("/")) {
        return file;
    }

    if (!file.startsWith(".")) {
        const parts = file.split("/");
        let root;
        if (file.startsWith("@")) {
            root = join(parts.shift(), parts.shift(), "package.json");
        } else {
            root = join(parts.shift(), "package.json");
        }

        const pkgJson = require.resolve(root);
        return join(dirname(pkgJson), ...parts);
    }

    return path.resolve(file);
};

const uploadObject = async (params, context) => {
    const objectPath = resolveFilePath(params.source);

    if (!fs.existsSync(objectPath)) {
        throw Error(`${params.source} does not exist!`);
    }

    const stats = fs.lstatSync(objectPath);

    params.objectPath = objectPath;

    if (stats.isDirectory()) {
        return params.zip ? await uploadArchive(params, context) : await uploadDir(params, context);
    }

    return await uploadFile(params, context);
};

const uploadDir = async ({ s3, bucket, objectPath, source, key, cacheControl }, context) => {
    context.instance.debug(`Uploading directory %o to %o`, source, `${bucket}/${key}`);

    const items = klawSync(objectPath);

    const uploadItems = [];
    items.forEach(item => {
        if (item.stats.isDirectory()) {
            return;
        }

        let objectKey = path.relative(objectPath, item.path);

        if (key) {
            objectKey = path.posix.join(key, objectKey);
        }

        // convert backslashes to forward slashes on windows
        if (path.sep === "\\") {
            objectKey = objectKey.replace(/\\/g, "/");
        }

        const itemParams = {
            Bucket: bucket,
            Key: objectKey,
            Body: fs.readFileSync(item.path),
            ContentType: mime.lookup(path.basename(item.path)) || "application/octet-stream",
            CacheControl: cacheControl
        };

        uploadItems.push(s3.upload(itemParams).promise());
    });

    await Promise.all(uploadItems);
};

const uploadArchive = async ({ s3, bucket, objectPath, source, key, cacheControl }, context) => {
    context.instance.debug(
        `Creating archive from %o and uploading to %o`,
        source,
        `${bucket}/${key}`
    );

    return new Promise((resolve, reject) => {
        const archive = archiver("zip", {
            zlib: { level: 9 }
        });

        archive.glob("**/*", { cwd: objectPath }, {});

        archive
            .pipe(
                UploadStream(s3, {
                    Bucket: bucket,
                    Key: key,
                    CacheControl: cacheControl
                })
            )
            .on("error", reject)
            .on("finish", resolve);

        archive.finalize();
    });
};

const uploadFile = async ({ s3, bucket, objectPath, source, key, cacheControl }, context) => {
    context.instance.debug(`Uploading file %o to %o`, source, `${bucket}/${key}`);

    return new Promise((resolve, reject) => {
        fs.createReadStream(objectPath)
            .pipe(
                UploadStream(s3, {
                    Bucket: bucket,
                    Key: key,
                    ContentType: mime.lookup(objectPath) || "application/octet-stream",
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

const createContentHash = async source => {
    const { hash } = await hashElement(resolveFilePath(source));
    return hash;
};

module.exports = { uploadObject, createContentHash };
