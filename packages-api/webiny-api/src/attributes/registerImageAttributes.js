// @flow
import { EntityAttributesContainer } from "webiny-entity";
import { Entity } from "webiny-api";
import ImageAttribute from "./imageAttribute";
import type { ImageProcessor } from "../../types";

export default (config: { entity: Class<Entity>, processor: ImageProcessor, quality: number }) => {
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
        return attribute;
    };
};
