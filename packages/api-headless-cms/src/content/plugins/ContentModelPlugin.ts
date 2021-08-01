import { Plugin } from "@webiny/plugins";
import { CmsContentModel } from "../../types";

export class ContentModelPlugin extends Plugin {
    public static readonly type = "cms-content-model";
    contentModel: CmsContentModel;

    constructor(contentModel: CmsContentModel) {
        super();
        this.contentModel = contentModel;
    }
}
