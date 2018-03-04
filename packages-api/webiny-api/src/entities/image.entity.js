// @flow
import path from "path";
import File from "./file.entity";
import type { EntitySaveParams, EntityDeleteParams } from "webiny-entity/types";
import type { ImageProcessor } from "../../types";

export type ImagePresets = {
    [preset: string]: { width: number, height: number }
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
        this.attr("aspectRatio").dynamic(() => {
            if (this.height) {
                return parseFloat((this.width / this.height).toFixed(3));
            }

            return 0;
        });
        this.attr("isPortrait").dynamic(() => {
            return this.aspectRatio <= 1;
        });
        this.attr("isLandscape").dynamic(() => {
            return this.aspectRatio > 1;
        });
    }

    // eslint-disable-next-line
    async save(params: EntitySaveParams & Object = {}) {
        if (this.src.startsWith("data:")) {
            const imageSize = await import("image-size");
            this.buffer = Buffer.from(this.src.split(",").pop(), "base64");
            const { width, height } = imageSize(this.buffer);
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
            return this.storage.getURL(this.src);
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

        const presetFile = await Image.findOne({ query: { ref: this.id, preset } });
        if (presetFile) {
            return presetFile.setStorage(this.storage).getURL();
        }

        // Build preset key based on the original key + name of the preset
        const { dir, name, ext } = path.parse(this.src);
        let presetKey = path.join(dir, name + "-" + preset, ext);

        const currentFile = await this.storage.getFile(this.src);
        const newImage = await this.processor({
            image: currentFile,
            transformations: this.presets[preset]
        });
        presetKey = await this.storage.setFile(presetKey, { body: newImage });

        const imageSize = await import("image-size");
        const { width: actualWidth, height: actualHeight } = imageSize(newImage);

        // Create new entity
        const ImageClass = this.constructor;
        const presetImage = new ImageClass();
        presetImage.populate({
            ref: this.classId + ":" + this.id,
            name: this.name,
            title: this.title,
            src: presetKey,
            preset,
            width: actualWidth,
            height: actualHeight,
            type: this.type,
            ext: this.ext,
            size: newImage.length
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
     * @return EntityCollection
     */
    async getDerivedImages() {
        const sizes = await Image.find({ query: { preset: { $ne: "original" }, ref: this.id } });
        return sizes.map(size => {
            size.setStorage(this.storage);
            return this;
        });
    }
}

Image.classId = "Image";
Image.tableName = "Images";

export default Image;
