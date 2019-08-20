// @flow
import { Entity } from "webiny-entity";

export interface ICategory extends Entity {
    name: string;
    slug: string;
    url: string;
    layout: string;
}

export function categoryFactory(): Class<ICategory> {
    return class Category extends Entity {
        static classId = "PbCategory";

        name: string;
        slug: string;
        url: string;
        layout: string;

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
        }
    };
}
