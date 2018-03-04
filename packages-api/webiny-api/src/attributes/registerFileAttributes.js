// @flow
import { EntityAttributesContainer } from "webiny-entity";
import { Entity } from "webiny-api";

import FileAttribute from "./fileAttribute";
import FilesAttribute from "./filesAttribute";

export default (config: { entity: Class<Entity> }) => {
    /**
     * File attribute
     * @package webiny-api
     * @return {FileAttribute}
     */
    EntityAttributesContainer.prototype.file = function () {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new FileAttribute(this.name, this, config.entity));
        return parent.getAttribute(this.name);
    };

    /**
     * Files attribute
     * @package webiny-api
     * @return {FilesAttribute}
     */
    EntityAttributesContainer.prototype.files = function () {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new FilesAttribute(this.name, this, config.entity));
        return parent.getAttribute(this.name);
    };
};
