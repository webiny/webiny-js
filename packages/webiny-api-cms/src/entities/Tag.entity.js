// @flow
import { Entity } from "webiny-entity";

export interface ITag extends Entity {
    name: string;
}

export function tagFactory(): Class<ITag> {
    return class Tag extends Entity {
        static classId = "CmsTag";
        static storageClassId = "Cms_Tags";

        name: string;
        constructor() {
            super();
            this.attr("name")
                .char()
                .setValidators("required");
        }
    };
}
