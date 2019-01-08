// @flow
import { Entity } from "webiny-entity";
import sizeOf from "image-size";
import FileModel from "./File.model";

type ElementType = "element" | "block";

export interface IElement extends Entity {
    name: string;
    content: Object;
    type: ElementType;
    category: ?string;
    preview: Object;
}

export function elementFactory(): Class<IElement> {
    return class Element extends Entity {
        static classId = "CmsElement";
        static storageClassId = "Cms_Elements";

        name: string;
        content: Object;
        type: ElementType;
        category: ?string;
        preview: Object;

        constructor() {
            super();

            this.attr("name")
                .char()
                .setValidators("required");

            this.attr("category").char();

            this.attr("content").object();

            this.attr("type")
                .char()
                .setValidators("required,in:element:block");

            this.attr("preview").model(FileModel);
        }

        /* TODO: remove this method before release! */
        async updateImage() {
            const fileName = this.preview.name;
            const dimensions = await sizeOf(process.cwd() + "/static/" + fileName);
            // eslint-disable-next-line
            console.log(process.cwd() + "/static/" + fileName);
            this.preview.meta = {
                width: dimensions.width,
                height: dimensions.height
            };
            await this.save();
        }
    };
}

// select name from Cms_Elements ORDER BY LENGTH(`name`), `name`;
