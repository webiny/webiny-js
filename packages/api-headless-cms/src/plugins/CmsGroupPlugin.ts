import { Plugin } from "@webiny/plugins";
import { CmsGroup as BaseCmsGroup } from "~/types";

export interface CmsGroup extends Omit<BaseCmsGroup, "locale" | "tenant" | "webinyVersion"> {
    tenant?: string;
    locale?: string;
}
export class CmsGroupPlugin extends Plugin {
    public static override readonly type: string = "cms-content-model-group";
    contentModelGroup: CmsGroup;

    constructor(contentModelGroup: CmsGroup) {
        super();
        this.contentModelGroup = contentModelGroup;
    }
}
