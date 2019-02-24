// @flow
import { Entity } from "webiny-entity";

export interface IMenu extends Entity {
    name: string;
    slug: string;
    description: string;
}

export function menuFactory(): Class<IMenu> {
    return class Menu extends Entity {
        static classId = "CmsMenu";

        name: string;
        slug: string;
        description: string;

        constructor() {
            super();

            this.attr("title")
                .char()
                .setValidators("required");

            this.attr("slug")
                .char()
                .setValidators("required")
                .setOnce();

            this.attr("description").char();

            this.attr("items").object();

            this.on("beforeCreate", async () => {
                const existingMenu = await Menu.findOne({ query: { slug: this.slug } });
                if (existingMenu) {
                    throw Error(`Menu with slug "${this.slug}" already exists.`);
                }
            });
        }
    };
}
