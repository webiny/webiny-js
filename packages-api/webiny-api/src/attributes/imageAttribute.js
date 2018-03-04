// @flow
import _ from "lodash";
import FileAttribute from "./fileAttribute";
import type { ImageProcessor } from "../../types";
import Image, { type ImagePresets } from "../entities/image.entity";

class ImageAttribute extends FileAttribute {
    quality: number;

    setProcessor(processor: ImageProcessor): ImageAttribute {
        this.processor = processor;
        return this;
    }

    setQuality(quality: number): ImageAttribute {
        this.quality = quality;
        return this;
    }

    setPresets(presets: ImagePresets = {}): Image {
        this.presets = presets;

        return this;
    }

    async getValue() {
        let value = await FileAttribute.prototype.getValue.call(this);
        if (value instanceof this.getEntityClass()) {
            value.setProcessor(this.processor);
            value.setQuality(this.quality);
            value.setPresets(this.presets);
            if (this.storage) {
                value.setStorage(this.storage).setStorageFolder(this.storageFolder);
            }
        }

        return value;
    }

    // $FlowIgnore
    async setValue(value) {
        const currentValue = await this.getValue();
        await FileAttribute.prototype.setValue.call(this, value);

        const newValue = await this.getValue();
        if (newValue instanceof this.getEntityClass()) {
            newValue.setPresets(this.presets);
            newValue.setQuality(this.quality);
            newValue.setProcessor(this.processor);
            newValue.tags = _.uniqWith(this.tags.concat(newValue.tags), _.isEqual);
            if (this.storage) {
                newValue.setStorage(this.storage).setStorageFolder(this.storageFolder);
            }
        }

        // If new value is being assigned and there is an existing file - delete the existing file after a successful save
        if (currentValue && (!newValue || currentValue.id !== newValue.id)) {
            this.getParentModel()
                .getParentEntity()
                .on("afterSave", async () => {
                    await currentValue.delete({ permanent: true });
                })
                .setOnce();
        }

        return this;
    }
}

export default ImageAttribute;
