import { Plugin } from "@webiny/plugins";
import { CmsModel as CmsModelBase } from "~/types";

interface CmsModel extends Omit<CmsModelBase, "locale" | "tenant" | "webinyVersion"> {
    locale?: string;
    tenant?: string;
}

export class CmsModelPlugin extends Plugin {
    public static override readonly type: string = "cms-content-model";
    contentModel: CmsModel;

    constructor(contentModel: CmsModel) {
        super();
        this.contentModel = contentModel;
    }
}

export const createCmsModel = (model: CmsModel): CmsModelPlugin => {
    return new CmsModelPlugin(model);
};
