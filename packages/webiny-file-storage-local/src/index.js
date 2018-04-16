// @flow
import _ from "lodash";
import fecha from "fecha";
import fs from "fs-extra";
import path from "path";
import globby from "globby";
import mime from "mime-types";
import { StorageError } from "webiny-file-storage";
import type { IFileData, IFileStorageDriver } from "webiny-file-storage/types";

declare type LocalStorageDriverConfig = {
    createDatePrefix: boolean,
    publicUrl: string,
    directory: string
};

class LocalStorageDriver implements IFileStorageDriver {
    config: LocalStorageDriverConfig;

    constructor(config: LocalStorageDriverConfig) {
        if (config.publicUrl) {
            config.publicUrl = _.trimEnd(config.publicUrl, "/");
        }

        this.config = config;
    }

    /**
     * Reads the contents of the file
     */
    getFile(key: string, options?: Object): Promise<IFileData> {
        const filePath = path.join(this.config.directory, key);

        const opts: { encoding?: string, flag?: string } = {};
        if (options && options.encoding) {
            opts.encoding = (options.encoding: string);
        }

        return new Promise((resolve, reject) => {
            fs.readFile(filePath, opts, (err: ?ErrnoError, data: string | Buffer) => {
                if (err) {
                    return reject(new StorageError(err.message));
                }

                resolve({ body: data });
            });
        });
    }

    /**
     * Writes the given File
     */
    setFile(key: string, file: IFileData): Promise<string> {
        if (file.body === null) {
            return Promise.reject(new StorageError("File body must be a string or a Buffer"));
        }

        let newKey = key;
        if (this.config.createDatePrefix) {
            if (!/^\d{4}\/\d{2}\/\d{2}\//.test(newKey)) {
                newKey = path.join(fecha.format(Date.now(), "YYYY/MM/DD"), key);
            }
        }

        newKey = _.trimStart(newKey, "/");

        const filePath = path.join(this.config.directory, newKey);
        const content: string | Buffer = file.body;
        return fs.outputFile(filePath, content).then(() => newKey);
    }

    /**
     * Get meta data
     */
    // eslint-disable-next-line
    getMeta(key: string): Promise<?Object> {
        return Promise.resolve(null);
    }

    /**
     * Set meta data
     */
    // eslint-disable-next-line
    setMeta(key: string, meta: Object): Promise<boolean> {
        return Promise.resolve(true);
    }

    /**
     * Checks whether the file exists
     */
    exists(key: string): Promise<boolean> {
        return fs.pathExists(path.join(this.config.directory, key));
    }

    /**
     * Returns an array of all keys (files and directories)
     *
     * For storage that doesn't support directories, both parameters are irrelevant.
     *
     * @param key       (Optional) Key of a directory to get keys from. If not set - keys will be read from the storage root.
     * @param filter    (Optional) Glob pattern to filter returned file keys
     */
    getKeys(key?: string, filter?: string): Promise<Array<string>> {
        const pattern = path.join(key || "", filter || "*");

        const options = {
            cwd: this.config.directory,
            root: this.config.directory
        };

        return globby(pattern, options).then(arr => {
            return arr.map(file => _.trimStart(file.replace(this.config.directory, ""), "/"));
        });
    }

    /**
     * Returns the last modified time
     */
    getTimeModified(key: string): Promise<?number> {
        const filePath = path.join(this.config.directory, key);
        return new Promise((resolve, reject) => {
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    return reject(err);
                }
                resolve(stats.mtime.getTime());
            });
        });
    }

    /**
     * Deletes the file
     */
    delete(key: string): Promise<boolean> {
        const filePath = path.join(this.config.directory, key);
        return fs.remove(filePath).then(() => true);
    }

    /**
     * Renames a file
     */
    async rename(sourceKey: string, targetKey: string): Promise<boolean> {
        const source = path.join(this.config.directory, sourceKey);
        const target = path.join(this.config.directory, targetKey);
        return fs.move(source, target).then(() => true);
    }

    /**
     * Returns public file URL
     */
    getURL(key: string): string {
        if (!this.config.publicUrl) {
            return key;
        }

        return this.config.publicUrl + "/" + _.trimStart(key, "/");
    }

    /**
     * Get file size (if supported)
     */
    getSize(key: string): Promise<?number> {
        const filePath = path.join(this.config.directory, key);
        return new Promise((resolve, reject) => {
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    return reject(err);
                }
                resolve(stats.size);
            });
        });
    }

    getContentType(key: string): Promise<?string> {
        const filePath = path.join(this.config.directory, key);
        return Promise.resolve(mime.lookup(filePath));
    }

    /**
     * Get absolute file path (if supported).
     * Return original file key if not supported.
     */
    getAbsolutePath(key: string): Promise<string> {
        return Promise.resolve(path.join(this.config.directory, key));
    }
}

export default LocalStorageDriver;
