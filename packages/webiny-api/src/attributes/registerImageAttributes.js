// @flow
import { EntityAttributesContainer } from "webiny-entity";
import { Entity, Image } from "webiny-api";
import ImageAttribute from "./imageAttribute";
import type { ImageProcessor } from "../../types";
import type { Storage } from "webiny-file-storage";
import ImagesAttribute from "./imagesAttribute";

export default (config: {
    entity: Class<Entity>,
    processor: ImageProcessor,
    storage: Storage,
    quality: number
}) => {
    Image.prototype.storage = config.storage;
    Image.prototype.processor = config.processor;
    Image.prototype.quality = config.quality;

    /**
     * Image attribute
     * @package webiny-api
     * @return {ImageAttribute}
     */
    EntityAttributesContainer.prototype.image = function() {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new ImageAttribute(this.name, this, config.entity));
        const attribute = parent.getAttribute(this.name);
        attribute.setProcessor(config.processor);
        attribute.setQuality(config.quality);
        attribute.setStorage(config.storage);
        return attribute;
    };

    /**
     * Images attribute
     * @package webiny-api
     * @return {ImagesAttribute}
     */
    EntityAttributesContainer.prototype.images = function() {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new ImagesAttribute(this.name, this, config.entity));
        const attribute = parent.getAttribute(this.name);
        attribute.setProcessor(config.processor);
        attribute.setQuality(config.quality);
        attribute.setStorage(config.storage);
        return attribute;
    };
};
