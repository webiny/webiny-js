// @flow
import { Entity } from "webiny-entity";
import sizeOf from "image-size";
import FileModel from "./File.model";

class PreviewModel extends FileModel {
    constructor() {
        super();

        this.attr("width").integer();
        this.attr("height").integer();
    }
}

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

            this.attr("preview").model(PreviewModel);
        }

        /* TODO: remove this method before release! */
        async updateImage() {
            const fileName = this.preview.name;
            const dimensions = await sizeOf(process.cwd() + "/static/" + fileName);
            console.log(process.cwd() + "/static/" + fileName);
            this.preview.width = dimensions.width;
            this.preview.height = dimensions.height;
            await this.save();
        }
    };
}

// select name from Cms_Elements ORDER BY LENGTH(`name`), `name`;
