import { EntityAttributesContainer } from "webiny-entity";

import FileAttribute from "./fileAttribute";
import FilesAttribute from "./filesAttribute";

export default () => {
    /**
     * File attribute
     * @package webiny-api
     * @return {FileAttribute}
     */
    EntityAttributesContainer.prototype.file = function() {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new FileAttribute(this.name, this));
        return parent.getAttribute(this.name);
    };

    /**
     * Files attribute
     * @package webiny-api
     * @return {FileAttribute}
     */
    EntityAttributesContainer.prototype.files = function() {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new FilesAttribute(this.name, this));
        return parent.getAttribute(this.name);
    };
};
