// @flow
import { Entity, type EntityCollection } from "webiny-entity";

export interface ICategory extends Entity {
    name: string;
    slug: string;
    url: string;
    layout: string;
    pages: EntityCollection;
}

export function categoryFactory({ user = {}, entities }: Object): Class<ICategory> {
    return class Category extends Entity {
        static classId = "CmsCategory";
        static storageClassId = "Cms_Categories";

        name: string;
        slug: string;
        url: string;
        layout: string;
        pages: EntityCollection;

        constructor() {
            super();

            this.attr("name")
                .char()
                .setValidators("required");

            this.attr("slug")
                .char()
                .setValidators("required");

            this.attr("url")
                .char()
                .setValidators("required");

            this.attr("layout").char();

            this.attr("pages").entities(entities.Page).setAutoDelete(false);
        }
    }
}

