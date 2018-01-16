// @flow
import Storage from './storage';

export default class File implements IFile {
    key: string;
    storage: Storage;
    file: IFileData;

    constructor(key: string, storage: Storage) {
        this.key = key;
        this.storage = storage;
        this.file = {
            body: null,
            meta: null
        };
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
    async getBody(options?: { encoding: string }): Promise<null | string | Buffer> {
        if (!this.file.body) {
            const file = await this.storage.getFile(this.key, options);
            if (file) {
                this.file = file;
            }
        }
        return this.file.body;
    }

    /**
     * Get file meta
     */
    async getMeta(): Promise<Object | null> {
        if (!this.file.meta) {
            this.file.meta = await this.storage.getMeta(this.key);
        }
        return this.file.meta;
    }

    /**
     * Get time modified
     */
    getTimeModified(): Promise<number | null> {
        return this.storage.getTimeModified(this.key);
    }

    /**
     * Set file contents (writes contents to storage)
     */
    setBody(data: string | Buffer): void {
        this.file.body = data;
    }

    /**
     * Set file meta
     */
    setMeta(meta: Object): void {
        this.file.meta = meta;
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
    async save(): Promise<boolean | string> {
        const newKey = await this.storage.setFile(this.key, this.file);
        if (typeof newKey === 'string') {
            this.key = newKey;
        }
        return newKey;
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
    getSize(): Promise<number | null> {
        return this.storage.getSize(this.key);
    }
}