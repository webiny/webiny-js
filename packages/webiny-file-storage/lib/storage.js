"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

class Storage {
    constructor(driver) {
        this.driver = driver;
    }

    /**
     * Reads the contents of the file
     */
    getFile(key, options) {
        return this.driver.getFile(key, options);
    }

    /**
     * Writes the given File
     */
    setFile(key, file) {
        return this.driver.setFile(key, file);
    }

    /**
     * Get meta data
     */
    getMeta(key) {
        return this.driver.getMeta(key);
    }

    /**
     * Set meta data
     */
    setMeta(key, meta) {
        return this.driver.setMeta(key, meta);
    }

    /**
     * Checks whether the file exists
     */
    exists(key) {
        return this.driver.exists(key);
    }

    /**
     * Returns an array of all keys (files and directories)
     *
     * For storage that doesn't support directories, both parameters are irrelevant.
     *
     * @param key       (Optional) Key of a directory to get keys from. If not set - keys will be read from the storage root.
     * @param filter    (Optional) Glob pattern to filter returned file keys
     */
    getKeys(key, filter) {
        return this.driver.getKeys(key, filter);
    }

    /**
     * Returns the last modified time
     */
    getTimeModified(key) {
        return this.driver.getTimeModified(key);
    }

    /**
     * Deletes the file
     */
    delete(key) {
        return this.driver.delete(key);
    }

    /**
     * Renames a file
     */
    rename(sourceKey, targetKey) {
        return this.driver.rename(sourceKey, targetKey);
    }

    /**
     * Returns public file URL
     */
    getURL(key) {
        return this.driver.getURL(key);
    }

    /**
     * Get file size (if supported)
     */
    getSize(key) {
        return this.driver.getSize(key);
    }

    /**
     * Returns content type
     */
    getContentType(key) {
        return this.driver.getContentType(key);
    }

    /**
     * Get absolute file path (if supported)
     */
    getAbsolutePath(key) {
        return this.driver.getAbsolutePath(key);
    }
}
exports.default = Storage;
//# sourceMappingURL=storage.js.map
