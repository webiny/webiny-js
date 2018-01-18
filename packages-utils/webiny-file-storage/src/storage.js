// @flow
class Storage {
    driver: IFileStorageDriver;

    constructor(driver: IFileStorageDriver) {
        this.driver = driver;
    }

    /**
     * Reads the contents of the file
     */
    getFile(key: string, options?: Object): Promise<IFileData> {
        return this.driver.getFile(key, options);
    }

    /**
     * Writes the given File
     */
    setFile(key: string, file: IFileData): Promise<string> {
        return this.driver.setFile(key, file);
    }

    /**
     * Get meta data
     */
    getMeta(key: string): Promise<?Object> {
        return this.driver.getMeta(key);
    }

    /**
     * Set meta data
     */
    setMeta(key: string, meta: Object): Promise<boolean> {
        return this.driver.setMeta(key, meta);
    }

    /**
     * Checks whether the file exists
     */
    exists(key: string): Promise<boolean> {
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
    getKeys(key?: string, filter?: string): Promise<Array<string>> {
        return this.driver.getKeys(key, filter);
    }

    /**
     * Returns the last modified time
     */
    getTimeModified(key: string): Promise<?number> {
        return this.driver.getTimeModified(key);
    }

    /**
     * Deletes the file
     */
    delete(key: string): Promise<boolean> {
        return this.driver.delete(key);
    }

    /**
     * Renames a file
     */
    rename(sourceKey: string, targetKey: string): Promise<boolean> {
        return this.driver.rename(sourceKey, targetKey);
    }

    /**
     * Returns public file URL
     */
    getURL(key: string): string {
        return this.driver.getURL(key);
    }

    /**
     * Get file size (if supported)
     */
    getSize(key: string): Promise<?number> {
        return this.driver.getSize(key);
    }

    /**
     * Returns content type
     */
    getContentType(key: string): Promise<?string> {
        return this.driver.getContentType(key);
    }

    /**
     * Get absolute file path (if supported)
     */
    getAbsolutePath(key: string): Promise<string> {
        return this.driver.getAbsolutePath(key);
    }
}

export default Storage;