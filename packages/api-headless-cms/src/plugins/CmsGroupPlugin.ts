import { Plugin } from "@webiny/plugins";
import type { CmsGroup as BaseCmsGroup } from "~/types/index.js";

export interface CmsGroupInput extends Omit<BaseCmsGroup, "locale" | "tenant" | "isPlugin"> {
    tenant?: string;
    locale?: string;
}

export interface CmsGroup extends Omit<BaseCmsGroup, "locale" | "tenant"> {
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

/**
 * @deprecated Use `createCmsGroupPlugin` instead.
 */
export const createCmsGroup = (group: CmsGroup): CmsGroupPlugin => {
    return new CmsGroupPlugin(group);
};

/**
 * @deprecated Use `createModelGroupPlugin` instead.
 */
export const createCmsGroupPlugin = (group: CmsGroup): CmsGroupPlugin => {
    return new CmsGroupPlugin(group);
};

export const createModelGroupPlugin = (group: CmsGroup): CmsGroupPlugin => {
    return new CmsGroupPlugin(group);
};
