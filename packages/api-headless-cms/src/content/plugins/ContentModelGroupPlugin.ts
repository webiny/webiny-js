import { Plugin } from "@webiny/plugins";
import { CmsContentModelGroup as BaseCmsContentModelGroup } from "~/types";

export interface CmsContentModelGroup
    extends Omit<BaseCmsContentModelGroup, "locale" | "tenant" | "webinyVersion"> {
    tenant?: string;
    locale?: string;
}
export class ContentModelGroupPlugin extends Plugin {
    public static readonly type: string = "cms-content-model-group";
    contentModelGroup: CmsContentModelGroup;

    constructor(contentModelGroup: CmsContentModelGroup) {
        super();
        this.contentModelGroup = contentModelGroup;
    }
}
