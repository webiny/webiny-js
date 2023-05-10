import { Plugin } from "@webiny/plugins";

export interface CmsModelModifierPluginParams {}

export class CmsModelModifierPlugin extends Plugin {
    public constructor(params: CmsModelModifierPluginParams) {
        super();
    }
}

export const createCmsModelModifierPlugin = (params: CmsModelModifierPluginParams) => {
    return new CmsModelModifierPlugin(params);
};
