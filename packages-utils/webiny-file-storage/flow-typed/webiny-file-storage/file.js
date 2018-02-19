import type Storage from "../../src/storage";

declare interface IFile {
    /**
     * Get file storage
     */
    getStorage(): Storage;

    /**
     * Get file key
     */
    getKey(): string;

    /**
     * Get public file URL
     */
    getUrl(): string;

    /**
     * Get file contents
     */
    getBody(options?: Object): Promise<string | Buffer>;

    /**
     * Get file meta
     */
    getMeta(): Promise<?Object>;

    /**
     * Get time modified
     */
    getTimeModified(): Promise<?number>;

    /**
     * Get content type
     */
    getContentType(key: string): Promise<?string>;

    /**
     * Set file body
     */
    setBody(body: string | Buffer): void;

    /**
     * Set file meta
     */
    setMeta(meta: Object): void;

    /**
     * Rename a file
     */
    rename(newKey: string): Promise<boolean>;

    /**
     * Delete a file
     */
    delete(): Promise<boolean>;

    /**
     * Save file
     */
    save(): Promise<boolean>;

    /**
     * Get absolute file path.
     * If storage driver does not support absolute paths (cloud storage), returns file key
     *
     * @return string
     */
    getAbsolutePath(): Promise<string>;

    /**
     * Get file size in bytes
     *
     * @return int|null Number of bytes or null
     */
    getSize(): Promise<?number>;
}
