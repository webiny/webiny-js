// @flow
import { EntityAttributesContainer } from "webiny-entity";
import { Entity, Image, type File } from "webiny-api";
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
    // $FlowFixMe
    EntityAttributesContainer.prototype.image = function() {
        const parent = this.getParentModel();
        const entity: Class<File> = (config.entity: any);

        parent.setAttribute(this.name, new ImageAttribute(this.name, this, entity));
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
    // $FlowFixMe
    EntityAttributesContainer.prototype.images = function() {
        const parent = this.getParentModel();
        const entity: Class<File> = (config.entity: any);

        parent.setAttribute(this.name, new ImagesAttribute(this.name, this, entity));
        const attribute = parent.getAttribute(this.name);
        attribute.setProcessor(config.processor);
        attribute.setQuality(config.quality);
        attribute.setStorage(config.storage);
        return attribute;
    };
};
