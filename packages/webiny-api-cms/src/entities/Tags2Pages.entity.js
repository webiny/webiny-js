// @flow
import { Entity } from "webiny-entity";

export function tags2PagesFactory({ api: { entities } }: Object) {
    return class Tags2Pages extends Entity {
        static classId = "CmsTags2Pages";
        static storageClassId = "Cms_Tags2Pages";

        constructor() {
            super();
            this.attr("page").entity(entities.Page);
            this.attr("tag").entity(entities.Tag);
        }
    };
}
