// @flow
import { EntityAttributesContainer } from "webiny-entity";
import { Entity } from "webiny-api";
import type { Storage } from "webiny-file-storage";

import FileAttribute from "./fileAttribute";
import FilesAttribute from "./filesAttribute";

export default (config: { entity: Class<Entity>, storage: Storage }) => {
    /**
     * File attribute
     * @package webiny-api
     * @return {FileAttribute}
     */
    EntityAttributesContainer.prototype.file = function() {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new FileAttribute(this.name, this, config.entity));
        const attribute = parent.getAttribute(this.name);
        attribute.setStorage(config.storage);
        return attribute;
    };

    /**
     * Files attribute
     * @package webiny-api
     * @return {FilesAttribute}
     */
    EntityAttributesContainer.prototype.files = function() {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new FilesAttribute(this.name, this, config.entity));
        const attribute = parent.getAttribute(this.name);
        attribute.setStorage(config.storage);
        return attribute;
    };
};
