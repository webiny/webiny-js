// @flow
import { Entity } from "webiny-entity";

export class Tags2Pages extends Entity {
    entity: Entity;
    entityClassId: string;
}

Tags2Pages.classId = "CmsTags2Pages";
Tags2Pages.storageClassId = "Cms_Tags2Pages";

export function tags2pagesFactory({ entities }: Object) {
    return class extends Tags2Pages {
        constructor() {
            super();
            this.attr("page").entity(entities.Page);
            this.attr("tag").entity(entities.Tag);
        }
    };
}
