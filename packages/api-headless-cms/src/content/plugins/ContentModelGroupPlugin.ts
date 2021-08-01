import { Plugin } from "@webiny/plugins";
import { CmsContentModelGroup } from "../../types";

export class ContentModelGroupPlugin extends Plugin {
    public static readonly type = "cms-content-model-group";
    contentModelGroup: CmsContentModelGroup;

    constructor(contentModelGroup: CmsContentModelGroup) {
        super();
        this.contentModelGroup = contentModelGroup;
    }
}
