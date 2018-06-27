// @flow
import { EntityAttributesContainer } from "webiny-entity";
import { Entity, File } from "./../entities";
import type { Storage } from "webiny-file-storage";

import FileAttribute from "./fileAttribute";
import FilesAttribute from "./filesAttribute";

// TODO: discuss configuration of File/Images
export default (config: { entity: Class<Entity>, storage: Storage }) => {
    File.prototype.storage = config.storage;

    /**
     * File attribute
     * @package webiny-api
     * @return {FileAttribute}
     */
    // $FlowFixMe
    EntityAttributesContainer.prototype.file = function() {
        const parent = this.getParentModel();
        const entity: Class<File> = (config.entity: any);
        parent.setAttribute(this.name, new FileAttribute(this.name, this, entity));
        return parent.getAttribute(this.name);
    };

    /**
     * Files attribute
     * @package webiny-api
     * @return {FilesAttribute}
     */
    // $FlowFixMe
    EntityAttributesContainer.prototype.files = function() {
        const parent = this.getParentModel();
        const entity: Class<File> = (config.entity: any);
        parent.setAttribute(this.name, new FilesAttribute(this.name, this, entity));
        return parent.getAttribute(this.name);
    };
};
