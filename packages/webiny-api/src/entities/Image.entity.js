// @flow
import path from "path";
import _ from "lodash";
import type { EntityFindParams, EntitySaveParams, EntityDeleteParams } from "webiny-entity/types";
import File from "./File.entity";
import type { ImageProcessor } from "../../types";

export type ImagePresets = {
    [preset: string]: Array<{ action: string }>
};

class Image extends File {
    quality: number;
    presets: ImagePresets;
    processor: ImageProcessor;

    constructor() {
        super();

        this.presets = {};

        this.attr("preset")
            .char()
            .setDefaultValue("original");
        this.attr("width")
            .integer()
            .setSkipOnPopulate();
        this.attr("height")
            .integer()
            .setSkipOnPopulate();
        this.attr("src")
            .char()
            .setDynamic(preset => {
                return /^(https?:)?\/\//.test(this.key) ? this.key : this.getURL(preset);
            });
        this.attr("aspectRatio")
            .float()
            .setDynamic(() => {
                if (this.height) {
                    return parseFloat((this.width / this.height).toFixed(3));
                }

                return 0;
            });
        this.attr("isPortrait")
            .boolean()
            .setDynamic(() => {
                return this.aspectRatio <= 1;
            });
        this.attr("isLandscape")
            .boolean()
            .setDynamic(() => {
                return this.aspectRatio > 1;
            });
    }

    static async find(params: EntityFindParams & Object = {}) {
        if (!_.has(params, "query.preset")) {
            _.set(params, "query.preset", "original");
        }

        return File.find.call(this, params);
    }

    // eslint-disable-next-line
    async save(params: EntitySaveParams & Object = {}) {
        if (this.data) {
            const imageSize = await import("image-size");
            const { width, height } = imageSize(this.data);
            this.width = width;
            this.height = height;
        }

        return File.prototype.save.call(this, params);
    }

    async delete(params: EntityDeleteParams & Object = { permanent: true }): Promise<void> {
        await File.prototype.delete.call(this, params);
        const sizes = await this.getDerivedImages();
        for (let i = 0; i < sizes.length; i++) {
            const image = sizes[i];
            await image.delete();
        }
    }

    getURL(preset: ?string): Promise<string> {
        if (!preset) {
            this.ensureStorage();
            return this.storage.getURL(this.key);
        }

        return this.getPresetURL(preset);
    }

    setPresets(presets: ImagePresets = {}): Image {
        this.presets = presets;

        return this;
    }

    setQuality(quality: number): Image {
        this.quality = quality;

        return this;
    }

    setProcessor(processor: ImageProcessor): Image {
        this.processor = processor;

        return this;
    }

    async getPresetURL(preset: string): Promise<string> {
        if (preset === "original") {
            return this.getURL();
        }

        const presetFile = await Image.findOne({
            query: { ref: this.classId + ":" + this.id, preset }
        });
        if (presetFile) {
            return presetFile.setStorage(this.storage).getURL();
        }

        // Build preset key based on the original key + name of the preset
        const { dir, name, ext } = path.parse(this.key);
        let presetKey = path.join(dir, name + "-" + preset) + ext;

        const currentFile = await this.storage.getFile(this.key);
        const newImage = await this.processor({
            image: currentFile.body,
            transformations: this.presets[preset]
        });

        // Create new entity
        const ImageClass = this.constructor;
        const presetImage = new ImageClass();
        presetImage.key = presetKey;

        presetImage.setStorage(this.storage);
        presetImage.setStorageFolder(this.storageFolder);
        presetImage.setProcessor(this.pr);

        presetImage.populate({
            ref: this,
            name: this.name,
            title: this.title,
            data: newImage,
            preset,
            tags: this.tags,
            type: this.type,
            ext: this.ext
        });
        await presetImage.save();

        return presetImage.getURL();
    }

    async deleteFileFromStorage() {
        if (this.preset === "original") {
            const sizes = await this.getDerivedImages();
            for (let i = 0; i < sizes.length; i++) {
                const image = sizes[i];
                await image.delete();
            }
        }

        return File.prototype.deleteFileFromStorage.call(this);
    }

    /**
     * Get existing sizes of this file
     *
     * @return {EntityCollection}
     */
    async getDerivedImages() {
        const sizes = await Image.find({
            query: {
                preset: { $ne: "original" },
                ref: this.classId + ":" + this.id
            }
        });

        return sizes.map(size => {
            size.setStorage(this.storage);
            return this;
        });
    }
}

Image.classId = "Image";
Image.tableName = "Images";

export default Image;
