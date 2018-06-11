// @flow
import type { EntityCollection } from "webiny-entity";
import FilesAttribute from "./filesAttribute";
import { Image } from "./../index";
import type { ImageProcessor } from "../../types";
import ImageAttribute from "./imageAttribute";
import type { ImagePresets } from "../entities/Image.entity";

class ImagesAttribute extends FilesAttribute {
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
        let values = await FilesAttribute.prototype.getValue.call(this);
        values.map(value => {
            if (value instanceof this.getEntitiesClass()) {
                value.setProcessor(this.processor);
                value.setQuality(this.quality);
                value.setPresets(this.presets);
            }
        });

        return values;
    }

    // $FlowIgnore
    async setValue(value: Array<{}> | EntityCollection): Promise<void> {
        await FilesAttribute.prototype.setValue.call(this, value);
        const values = await this.getValue();

        values.map(value => {
            if (value instanceof this.getEntitiesClass()) {
                value.setPresets(this.presets);
                value.setQuality(this.quality);
                value.setProcessor(this.processor);
            }
        });

        return this;
    }
}

export default ImagesAttribute;
