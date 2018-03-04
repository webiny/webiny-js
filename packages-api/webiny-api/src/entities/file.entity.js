// @flow
import path from "path";
import fileType from "file-type";
import { Storage } from "webiny-file-storage";
import { EntitySaveParams, EntityDeleteParams } from "webiny-entity/types";
import mdbid from "mdbid";
import type { IFileData } from "webiny-file-storage/types";
import Entity from "./entity";

class File extends Entity {
    storage: Storage;
    storageFolder: string;
    tags: Array<string>;
    buffer: Buffer;

    constructor() {
        super();

        this.storageFolder = "/";
        this.tags = [];

        this.attr("name")
            .char()
            .setValidators("required");
        this.attr("title").char();
        this.attr("size").integer();
        this.attr("type").char();
        this.attr("ext").char();
        this.attr("src")
            .char()
            .onGetJSONValue(value => {
                return /^(https?:)?\/\//.test(value) ? value : this.getURL();
            });
        this.attr("tags").array();
        this.attr("ref").char();
        this.attr("order")
            .integer()
            .setDefaultValue(0);
    }

    getURL() {
        this.ensureStorage();
        return this.storage.getURL(this.src);
    }

    getAbsolutePath() {
        this.ensureStorage();
        return this.storage.getAbsolutePath(this.src);
    }

    /**
     * @inheritDoc
     */
    populate(data: Object) {
        const fileContent = data["src"] || "";
        const newContents = fileContent.startsWith("data:");
        if (this.id) {
            if (newContents) {
                this.deleteFileFromStorage();
            } else {
                // These keys should not change if file contents is not changing
                delete data["src"];
                delete data["name"];
            }
        }

        return super.populate(data);
    }

    /**
     * @inheritDoc
     */
    // eslint-disable-next-line
    async save(params: EntitySaveParams & Object = {}) {
        // If new file contents is being saved...
        if (this.buffer || this.src.startsWith("data:")) {
            this.ensureStorage();
            if (!Buffer.isBuffer(this.buffer)) {
                this.buffer = Buffer.from(this.src.split(",").pop(), "base64");
            }

            const key = File.createKey(this.name);
            this.src = await this.storage.setFile(path.join(this.storageFolder, key), { body: this.buffer });
            this.size = this.buffer.length;
            const { ext, mime } = fileType(this.buffer);
            this.ext = ext;
            this.type = mime;
        }

        delete this.buffer;
        return Entity.prototype.save.call(this, params);
    }

    /**
     * @inheritDoc
     */
    async delete(params: EntityDeleteParams & Object = { permanent: true }): Promise<void> {
        await Entity.prototype.delete.call(this, params);
        await this.deleteFileFromStorage();
    }

    /**
     * Set File storage
     *
     * @param {Storage} storage
     *
     * @return this
     */
    setStorage(storage: Storage) {
        this.storage = storage;

        return this;
    }

    /**
     * Set storage folder
     *
     * @param {string} folder
     *
     * @return this
     */
    setStorageFolder(folder: string) {
        if (folder) {
            this.storageFolder = folder;
        }

        return this;
    }

    /**
     * Get file from storage
     *
     * @returns {Promise<IFileData>}
     */
    getFile(): Promise<IFileData> {
        this.ensureStorage();
        return this.storage.getFile(this.src);
    }

    /**
     * Create file storage key
     *
     * @param {string} name
     *
     * @return string
     */
    static createKey(name: string) {
        const { name: base, ext } = path.parse(name);

        const slug = base
            .toString()
            .toLowerCase()
            .replace(/\s+/g, "-") // Replace spaces with -
            .replace(/[^\w-]+/g, "") // Remove all non-word chars
            .replace(/--+/g, "-") // Replace multiple - with single -
            .replace(/^-+/, "") // Trim - from start of text
            .replace(/-+$/, ""); // Trim - from end of text

        return mdbid() + "-" + slug + ext;
    }

    /**
     * Delete current file from storage
     */
    deleteFileFromStorage() {
        this.ensureStorage();
        return this.storage.delete(this.src);
    }

    ensureStorage() {
        if (!(this.storage instanceof Storage)) {
            throw new Error("No storage configured for File entity!");
        }
    }
}

File.classId = "File";
File.tableName = "Files";

export default File;