declare type IFileData = {
    body: string | Buffer,
    meta?: Object
}

declare interface IFileStorageDriver {
    /**
     * Reads the contents of the file
     */
    getFile(key: string, options?: Object): Promise<IFileData>;

    /**
     * Writes the given file and returns final file key
     */
    setFile(key: string, file: IFileData): Promise<string>;

    /**
     * Get meta data
     */
    getMeta(key: string): Promise<?Object>;

    /**
     * Set meta data
     */
    setMeta(key: string, meta: Object): Promise<boolean>;

    /**
     * Checks whether the file exists
     */
    exists(key: string): Promise<boolean>;

    /**
     * Returns an array of all keys (files and directories)
     *
     * For storage that doesn't support directories, both parameters are irrelevant.
     *
     * @param key       (Optional) Key of a directory to get keys from. If not set - keys will be read from the storage root.
     * @param filter    (Optional) Glob pattern to filter returned file keys
     */
    getKeys(key?: string, filter?: string): Promise<Array<string>>;

    /**
     * Deletes the file
     */
    delete(key: string): Promise<boolean>;

    /**
     * Renames a file
     */
    rename(sourceKey: string, targetKey: string): Promise<boolean>;

    /**
     * Returns public file URL
     */
    getURL(key: string): string;

    /**
     * Get file size (if supported)
     */
    getSize(key: string): Promise<?number>;

    /**
     * Returns the last modified time
     */
    getTimeModified(key: string): Promise<?number>;

    /**
     * Returns content type
     */
    getContentType(key: string): Promise<?string>;

    /**
     * Get absolute file path (if supported).
     * Return original file key if not supported.
     */
    getAbsolutePath(key: string): Promise<string>;
}
