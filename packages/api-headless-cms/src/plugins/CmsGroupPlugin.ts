import { Plugin } from "@webiny/plugins";
import { CmsGroup as BaseCmsGroup } from "~/types";

export interface CmsGroupInput
    extends Omit<BaseCmsGroup, "locale" | "tenant" | "webinyVersion" | "isPlugin"> {
    tenant?: string;
    locale?: string;
}

export interface CmsGroup extends Omit<BaseCmsGroup, "locale" | "tenant" | "webinyVersion"> {
    tenant?: string;
    locale?: string;
}

export class CmsGroupPlugin extends Plugin {
    public static override readonly type: string = "cms-content-model-group";
    public readonly contentModelGroup: CmsGroup;

    constructor(contentModelGroup: CmsGroupInput) {
        super();
        this.contentModelGroup = {
            ...contentModelGroup,
            isPlugin: true
        };
    }
}

export const createCmsGroup = (group: CmsGroup): CmsGroupPlugin => {
    return new CmsGroupPlugin(group);
};
