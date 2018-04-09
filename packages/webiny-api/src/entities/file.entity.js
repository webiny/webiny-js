// @flow
import path from "path";
import fileType from "file-type";
import { Storage } from "webiny-file-storage";
import type { EntitySaveParams, EntityDeleteParams } from "webiny-entity/types";
import mdbid from "mdbid";
import type { IFileData } from "webiny-file-storage/types";
import Entity from "./entity";

class File extends Entity {
    storage: Storage;
    storageFolder: string;
    tags: Array<string>;

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
        this.attr("data")
            .buffer("base64")
            .setToStorage(false);
        this.attr("key")
            .char()
            .setSkipOnPopulate();
        this.attr("src").dynamic(() => {
            return /^(https?:)?\/\//.test(this.key) ? this.key : this.getURL();
        });
        this.attr("tags")
            .array()
            .setDefaultValue([]);

        // `ref` can be linked with any Entity class so we have to provide a `classIdAttribute` to store related Entity classId
        this.attr("ref").entity([], { classIdAttribute: "refClassId" });
        this.attr("refClassId").char();

        this.attr("order")
            .integer()
            .setDefaultValue(0);
    }

    getURL() {
        this.ensureStorage();
        return this.storage.getURL(this.key);
    }

    getAbsolutePath() {
        this.ensureStorage();
        return this.storage.getAbsolutePath(this.key);
    }

    /**
     * @inheritDoc
     */
    populate(data: Object) {
        if (this.isExisting()) {
            data["data"] ? this.deleteFileFromStorage() : delete data["name"];
        }

        return super.populate(data);
    }

    /**
     * @inheritDoc
     */
    // eslint-disable-next-line
    async save(params: EntitySaveParams & Object = {}) {
        // If new file contents is being saved...
        if (this.data) {
            this.ensureStorage();

            let key = this.key || File.createKey(this.name);
            if (this.storageFolder !== "" && !key.startsWith(this.storageFolder + "/")) {
                key = path.join(this.storageFolder, key);
            }

            this.key = await this.storage.setFile(key, { body: this.data });
            this.size = this.data.length;
            const { ext, mime } = fileType(this.data);
            this.ext = ext;
            this.type = mime;
        }

        this.getAttribute("data").reset();
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
        return this.storage.getFile(this.key);
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
        return this.storage.delete(this.key);
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
