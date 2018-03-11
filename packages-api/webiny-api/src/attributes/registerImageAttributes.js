// @flow
import { EntityAttributesContainer } from "webiny-entity";
import { Entity } from "webiny-api";
import ImageAttribute from "./imageAttribute";
import type { ImageProcessor } from "../../types";
import type { Storage } from "webiny-file-storage";

export default (config: {
    entity: Class<Entity>,
    processor: ImageProcessor,
    storage: Storage,
    quality: number
}) => {
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
};
