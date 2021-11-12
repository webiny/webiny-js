import { Plugin } from "@webiny/plugins";
import { CmsContentModel as CmsContentModelBase } from "~/types";

export interface CmsContentModel
    extends Omit<CmsContentModelBase, "locale" | "tenant" | "webinyVersion"> {
    locale?: string;
    tenant?: string;
}

export class ContentModelPlugin extends Plugin {
    public static readonly type: string = "cms-content-model";
    contentModel: CmsContentModel;

    constructor(contentModel: CmsContentModel) {
        super();
        this.contentModel = contentModel;
    }
}
