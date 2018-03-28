// @flow
import _ from "lodash";
import AWS from "aws-sdk";
import fecha from "fecha";
import { StorageError } from "webiny-file-storage";
import type { IFileData, IFileStorageDriver } from "webiny-file-storage/types";
import type { S3StorageDriverConfig } from "../types";

// lock down AWS API versions
AWS.config.apiVersions = {
    s3: "2006-03-01"
};

/**
 * S3StorageDriver class instance is the AWS S3 driver for webiny-file-storage.
 *
 * @class S3StorageDriver
 * @example
 * import S3StorageDriver from "webiny-file-storage-s3";
 * import type { S3StorageDriverConfig } from "webiny-file-storage-s3";
 *
 * const params: S3StorageDriverConfig = {
 *     bucket: "TestBucket",
 *     accessKeyId: "AWS_AccessKeyId",
 *     secretAccessKey: "AWS_SecretAccessKey",
 *     region: "us-east-2",
 *     endpoint: "s3.us-east-2.amazonaws.com"
 * };
 *
 * const s3Storage = new S3StorageDriver(S3StorageDriverConfig);
 * s3Storage.getFile("fileKey");
 */
class S3StorageDriver implements IFileStorageDriver {
    config: S3StorageDriverConfig;
    s3: AWS.S3;

    constructor(config: S3StorageDriverConfig) {
        this.s3 = new AWS.S3(_.omit(config, ["createDatePrefix", "directory", "publicUrl"]));
        this.config = { ...config };
        if (this.config.directory) {
            this.config.directory = _.trim(this.config.directory, "/");
        }
    }

    /**
     * Returns the file and its content.
     * @param key This is the file identifier under which the file is stored.
     * @param options This is the list of additional parameters - defined by IFileStorageDriver, but not used in case of this driver.
     * @returns {Promise<IFileData>} `IFileData` object.
     */
    getFile(key: string, options?: Object): Promise<IFileData> {
        const params = {
            Bucket: this.config.bucket,
            Key: key
        };

        if (options !== null && options !== undefined) {
            return Promise.reject(
                new StorageError("S3 driver doesn't support the options parameter.")
            );
        }

        return this.s3
            .getObject(params)
            .promise()
            .then(data => {
                return { body: data.Body, meta: _.omit(data, ["Body"]) };
            });
    }

    /**
     * Writes the given file and returns final file key.
     * @param key This is the file identifier under which the file will be stored.
     * @param file This is the `IFileData` object containing the content and meta information.
     * @returns {Promise<string>} The final key under which the file is stored.
     */
    setFile(key: string, file: IFileData): Promise<string> {
        if (file.body === null) {
            return Promise.reject(new StorageError("File body must be a string or a Buffer"));
        }

        let newKey = key;

        // date prepend
        if (this.config.createDatePrefix) {
            // eslint-disable-next-line
            const regex = new RegExp(`^${this.config.directory}\/\\d{4}\/\\d{2}\/\\d{2}\/`);
            if (!regex.test(newKey)) {
                newKey = fecha.format(Date.now(), "YYYY/MM/DD") + "/" + key;
            }
        }

        // directory prepend
        const prefix = this.config.directory + "/";
        if (this.config.directory !== "" && !newKey.startsWith(prefix)) {
            newKey = prefix + newKey;
        }

        // check if file metadata is set
        let meta = {};
        if (file.meta) {
            meta = file.meta;
        }

        // save to s3
        const params = {
            Body: file.body,
            Bucket: this.config.bucket,
            Key: newKey,
            Metadata: meta
        };
        return this.s3
            .putObject(params)
            .promise()
            .then(() => {
                return newKey;
            });
    }

    /**
     * Returns file meta information.
     * @param key This is the file identifier under which the file is stored.
     * @returns {Promise<Object>} Object containing the file meta information.
     */
    getMeta(key: string): Promise<?Object> {
        const params = {
            Bucket: this.config.bucket,
            Key: key
        };

        return this.s3
            .headObject(params)
            .promise()
            .then((data: Object) => {
                return data;
            });
    }

    /**
     * Sets file meta information. Tne new meta information is merged with the existing meta information.
     * @param key This is the file identifier under which the file is stored.
     * @param meta This is the object containing the new meta information that will be added to the file.
     * @returns {Promise<boolean>} Returns `true` if meta has been set successfully, otherwise `false`.
     */
    setMeta(key: string, meta: Object): Promise<boolean> {
        return this.getFile(key).then((file: IFileData) => {
            return this.setFile(key, { body: file.body, meta: _.merge(file.meta, meta) }).then(
                () => {
                    return Promise.resolve(true);
                }
            );
        });
    }

    /**
     * Returns `true` if the file exists, otherwise false.
     * @param key This is the file identifier under which the file is stored.
     * @returns {Promise<boolean>}
     */
    exists(key: string): Promise<boolean> {
        return this.getMeta(key)
            .then(() => {
                return Promise.resolve(true);
            })
            .catch(() => Promise.resolve(false));
    }

    /**
     * Returns an array of all keys.
     * In case of S3, the `key`  parameter is used as a `Prefix` filter. Once the results matching this filter have
     * been retrieved a regex match with `filter` param is applied and then all matching files are returned.
     *
     * @param key       This is the "Prefix" filter.
     * @param filter    (Optional) Additional regex filter that will be applied
     * @returns {Promise<Array>} Array of file keys that match the given filters.
     */
    async getKeys(key?: string, filter?: string): Promise<Array<string>> {
        let keys = [];
        let result = [];
        let newResult = {};
        let continuationToken = "";

        if (typeof key !== "string") {
            return Promise.reject(
                new StorageError("S3 driver requires that the key parameter is present.")
            );
        }

        // get all objects matching the prefix
        do {
            newResult = await this.__listBucketContent(key, continuationToken);
            result = _.concat(result, newResult.items || []);

            continuationToken = newResult.continuationToken;
        } while (newResult.continuationToken);

        // filter the objects before returning
        if (typeof filter === "string") {
            const regex = new RegExp(filter, "g");
            result.forEach(item => {
                if (item.Key.match(regex) !== null) {
                    keys.push(item.Key);
                }
            });
        } else {
            result.forEach(item => {
                keys.push(item.Key);
            });
        }

        return keys;
    }

    /**
     * Delete the file.
     * @param key This is the file identifier under which the file is stored.
     * @returns {Promise<boolean>} `true` if the file is deleted successfully, otherwise `false`.
     */
    delete(key: string): Promise<boolean> {
        const params = {
            Bucket: this.config.bucket,
            Key: key
        };
        return this.s3
            .deleteObject(params)
            .promise()
            .then(() => {
                return true;
            });
    }

    /**
     * Rename the file.
     * @param sourceKey This is the new file key.
     * @param targetKey This is the current file identifier under which the file is stored.
     * @returns {Promise<boolean>} `true` if the file is renamed successfully, otherwise `false`.
     */
    rename(sourceKey: string, targetKey: string): Promise<boolean> {
        // Copy the object to a new location
        return this.s3
            .copyObject({
                Bucket: this.config.bucket,
                Key: targetKey,
                CopySource: "/" + this.config.bucket + "/" + sourceKey
            })
            .promise()
            .then(() => {
                // Delete the old object
                return this.s3
                    .deleteObject({
                        Bucket: this.config.bucket,
                        Key: sourceKey
                    })
                    .promise()
                    .then(() => {
                        return true;
                    });
            });
    }

    /**
     * Returns the public file url.
     * In case the `publicUrl` param is defined in the `S3StorageDriverConfig` the public url will return `publicUrl+key`.
     * In case the `publicUrl` param is not defined, the method uses the `endpoint` and `bucket` param to form the
     * public url.
     *
     * @param key This is the file identifier under which the file is stored.
     * @returns {string} Public URL.
     */
    getURL(key: string): string {
        if (!this.config.publicUrl) {
            return "https://" + this.config.endpoint + "/" + this.config.bucket + "/" + key;
        }

        return _.trimEnd(this.config.publicUrl, "/") + "/" + key;
    }

    /**
     * Get file size in bytes.
     *
     * @param key This is the file identifier under which the file is stored.
     * @returns {Promise<number>} Number of bytes.
     */
    getSize(key: string): Promise<?number> {
        return this.getMeta(key).then(data => {
            if (
                data === undefined ||
                data === null ||
                !("ContentLength" in data) ||
                typeof data.ContentLength !== "number"
            ) {
                return Promise.reject(new StorageError("Unable to determine object size."));
            } else {
                return data.ContentLength;
            }
        });
    }

    /**
     * Get file last modified time.
     *
     * @param key This is the file identifier under which the file is stored.
     * @returns {Promise<number>} Unix timestamp.
     */
    getTimeModified(key: string): Promise<?number> {
        return this.getMeta(key).then(data => {
            if (data === undefined || data === null || !("LastModified" in data)) {
                return Promise.reject(
                    new StorageError("Unable to determine object last modified time.")
                );
            } else {
                const date = new Date(data.LastModified);
                return date.getTime();
            }
        });
    }

    /**
     * Get file content type.
     *
     * @param key This is the file identifier under which the file is stored.
     * @returns {Promise<string>} File content type.
     */
    getContentType(key: string): Promise<?string> {
        return this.getMeta(key).then(data => {
            if (data === undefined || data === null || "ContentType" in data !== true) {
                return Promise.reject(new StorageError("Unable to determine object size."));
            } else {
                return data.ContentType;
            }
        });
    }

    /**
     * Get absolute file path.
     * @param key This is the file identifier under which the file is stored.
     * @returns {Promise<string>} In case of S3, the same `key` that is provided is returned.
     */
    getAbsolutePath(key: string): Promise<string> {
        return Promise.resolve(key);
    }

    /**
     * Returns a list of files matching the given prefix.
     * @param prefix
     * @param continuationToken
     * @returns {PromiseLike<T> | Promise<T>}
     * @private
     */
    __listBucketContent(prefix: string, continuationToken?: string): Promise<Object> {
        let params: {
            Bucket: string,
            FetchOwner: boolean,
            MaxKeys: number,
            Prefix?: string,
            ContinuationToken?: boolean | string
        } = {
            Bucket: this.config.bucket,
            FetchOwner: false,
            MaxKeys: 1000
        };

        params.Prefix = prefix;

        if (continuationToken) {
            params.ContinuationToken = continuationToken;
        }

        return this.s3
            .listObjectsV2(params)
            .promise()
            .then(data => {
                const result = {};
                result.items = data.Contents;

                // in case it's truncated, we also return the continuationToken
                if (data.IsTruncated) {
                    result.continuationToken = data.NextContinuationToken;
                } else {
                    result.continuationToken = false;
                }

                return result;
            });
    }
}

export default S3StorageDriver;
