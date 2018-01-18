// @flow
import Storage from './storage';

export default class File implements IFile {
    key: string;
    storage: Storage;
    file: IFileData;
    bodyLoaded: boolean;
    metaLoaded: boolean;

    constructor(key: string, storage: Storage) {
        this.key = key;
        this.storage = storage;
        this.file = { body: '' };
        this.bodyLoaded = false;
        this.metaLoaded = false;
    }

    /**
     * Get file storage
     */
    getStorage(): Storage {
        return this.storage;
    }

    /**
     * Get file key
     */
    getKey(): string {
        return this.key;
    }

    /**
     * Get public file URL
     */
    getUrl(): string {
        return this.storage.getURL(this.key);
    }

    /**
     * Get file body
     */
    async getBody(options?: Object): Promise<string | Buffer> {
        if (!this.bodyLoaded) {
            this.file = await this.storage.getFile(this.key, options);
            this.bodyLoaded = true;
            this.metaLoaded = true;
        }
        return this.file.body;
    }

    /**
     * Get file meta
     */
    async getMeta(): Promise<?Object> {
        if (!this.metaLoaded) {
            this.file.meta = await this.storage.getMeta(this.key);
            this.metaLoaded = true;
        }
        return this.file.meta;
    }

    /**
     * Set file contents (writes contents to storage)
     */
    setBody(data: string | Buffer): void {
        this.file.body = data;
        this.bodyLoaded = true;
    }

    /**
     * Set file meta
     */
    setMeta(meta: Object): void {
        this.file.meta = meta;
        this.metaLoaded = true;
    }

    /**
     * Get time modified
     */
    getTimeModified(): Promise<?number> {
        return this.storage.getTimeModified(this.key);
    }

    /**
     * Rename a file
     */
    rename(newKey: string): Promise<boolean> {
        return this.storage.rename(this.key, newKey);
    }

    /**
     * Delete a file
     */
    delete(): Promise<boolean> {
        return this.storage.delete(this.key);
    }

    /**
     * Save file (call `setFile` on Storage instance)
     */
    async save(): Promise<boolean> {
        this.key = await this.storage.setFile(this.key, this.file);
        return true;
    }

    /**
     * Get absolute file path.
     * If storage driver does not support absolute paths (cloud storage), returns file key
     *
     * @return string
     */
    getAbsolutePath(): Promise<string> {
        return this.storage.getAbsolutePath(this.key);
    }

    /**
     * Get file size in bytes
     */
    getSize(): Promise<?number> {
        return this.storage.getSize(this.key);
    }

    /**
     * Get content type
     */
    getContentType(key: string): Promise<?string> {
        return this.storage.getContentType(key);
    }
}