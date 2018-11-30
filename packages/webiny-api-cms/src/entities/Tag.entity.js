// @flow
import { Entity } from "webiny-entity";

export interface ITag extends Entity {
    name: string;
}

export function tagFactory({ api: { entities } }: Object): Class<ITag> {
    return class Tag extends Entity {
        static classId = "CmsTag";
        static storageClassId = "Cms_Tags";

        name: string;
        constructor() {
            super();
            this.attr("name")
                .char()
                .setValidators("required");

            this.on("beforeDelete", async () => {
                const usages = await entities.Tags2Pages.count({ tag: this.id });
                if (usages > 0) {
                    throw Error(`Cannot delete tag "${this.name}" - in use by ${usages} page(s).`);
                }
            });
        }
    };
}
