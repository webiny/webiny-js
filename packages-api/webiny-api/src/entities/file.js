// @flow
import path from "path";
import { Storage } from "webiny-file-storage";
import Entity from "./entity";
import { EntitySaveParams, EntityDeleteParams } from "webiny-entity/types";
import mdbid from "mdbid";
import type { IFileData } from "webiny-file-storage/types";

class File extends Entity {
    static DEFAULT_STORAGE: string;
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
        this.attr("src").char();
        this.attr("tags").array();
        this.attr("ref").char();
        this.attr("order")
            .integer()
            .setDefaultValue(0);
    }

    async toJSON(path: ?string) {
        const data = await Entity.prototype.toJSON.call(this, path);
        const { src } = data;
        if (typeof src === "string") {
            if (!src.includes("http://") && !src.includes("https://") && !src.startsWith("//")) {
                data.src = this.getUrl();
            }
        }

        return data;
    }

    getUrl() {
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
        const contents = this.src;
        if (contents.startsWith("data:")) {
            this.ensureStorage();
            const key = this.createKey(this.name);
            const body = Buffer.from(contents.split(",").pop(), "base64").toString("binary");
            this.src = await this.storage.setFile(path.join(this.storageFolder, key), { body });
            try {
                this.size = this.storage.getSize(this.src);
            } catch (e) {
                // Storage does not support reading of file size
            }
            this.ext = path.extname(this.src).substr(1);
        }

        return Entity.prototype.save.call(this);
    }

    /**
     * @inheritDoc
     */
    async delete(params: EntityDeleteParams & Object = {}) {
        await Entity.prototype.delete.call(this, params);
        if (params.permanent) {
            await this.deleteFileFromStorage();
        }
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
        this.storageFolder = folder;

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
    createKey(name: string) {
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

File.DEFAULT_STORAGE = "DefaultFileStorage";

export default File;
