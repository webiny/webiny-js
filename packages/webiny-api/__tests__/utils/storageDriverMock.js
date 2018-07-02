import _ from "lodash";
import fecha from "fecha";
import { StorageError } from "webiny-file-storage";
import type { IFileStorageDriver, IFileData } from "webiny-file-storage/types";

class MockDriver implements IFileStorageDriver {
    fileSystem: { [string]: IFileData };
    config: {
        cdnUrl: string,
        createDatePrefix: boolean
    };

    flush() {
        this.fileSystem = {};
    }

    constructor(config: Object = {}) {
        this.config = config;
        this.fileSystem = {};
    }

    /**
     * Reads the contents of the file
     */
    getFile(key: string, options?: Object): Promise<IFileData> {
        if (!_.has(this.fileSystem, key)) {
            return Promise.reject(new StorageError("File not found"));
        }
        return Promise.resolve(this.fileSystem[key]);
    }

    /**
     * Writes the given File
     */
    setFile(key: string, file: IFileData): Promise<string> {
        let newKey = key;
        if (this.config.createDatePrefix) {
            if (!/^\/\d{4}\/\d{2}\/\d{2}\//.test(newKey)) {
                newKey = "/" + fecha.format(Date.now(), "YYYY/MM/DD") + key;
            }
        }
        this.fileSystem[newKey] = { ...file };

        return Promise.resolve(newKey);
    }

    /**
     * Get meta data
     */
    getMeta(key: string): Promise<?Object> {
        return Promise.resolve(_.get(this.fileSystem, `${key}.meta`, null));
    }

    /**
     * Set meta data
     */
    setMeta(key: string, meta: Object): Promise<boolean> {
        if (!this.exists(key)) {
            return Promise.resolve(false);
        }

        this.fileSystem[key].meta = meta;
        return Promise.resolve(true);
    }

    /**
     * Checks whether the file exists
     */
    exists(key: string): Promise<boolean> {
        return Promise.resolve(_.has(this.fileSystem, key));
    }

    /**
     * Returns an array of all keys (files and directories)
     *
     * For storage that doesn't support directories, both parameters are irrelevant.
     *
     * @param key       (Optional) Key of a directory to get keys from. If not set - keys will be read from the storage root.
     * @param filter    (Optional) Glob pattern to filter returned file keys
     */
    getKeys(key?: string, filter?: string | null): Promise<Array<string>> {
        return Promise.resolve(_.keys(this.fileSystem));
    }

    /**
     * Returns the last modified time
     */
    getTimeModified(key: string): Promise<number | null> {
        return Promise.resolve(_.get(this.fileSystem[key], "meta.timeModified", null));
    }

    /**
     * Deletes the file
     */
    delete(key: string): Promise<boolean> {
        delete this.fileSystem[key];
        return Promise.resolve(true);
    }

    /**
     * Renames a file
     */
    rename(sourceKey: string, targetKey: string): Promise<boolean> {
        this.fileSystem[targetKey] = { ...this.fileSystem[sourceKey] };
        delete this.fileSystem[sourceKey];
        return Promise.resolve(true);
    }

    /**
     * Returns public file URL
     */
    getURL(key: string): string {
        return _.trim(this.config.cdnUrl, "/") + "/" + _.trim(key, "/");
    }

    /**
     * Get file size (if supported)
     */
    getSize(key: string): Promise<?number> {
        return Promise.resolve(_.get(this.fileSystem[key], "meta.size", null));
    }

    /**
     * Returns content type
     */
    getContentType(key: string): Promise<?string> {
        return Promise.resolve(_.get(this.fileSystem[key], "meta.type", null));
    }

    /**
     * Get absolute file path (if supported).
     * Return original file key if not supported.
     */
    getAbsolutePath(key: string): Promise<string> {
        return Promise.resolve(key);
    }
}

export default MockDriver;
