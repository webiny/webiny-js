import { Plugin } from "@webiny/plugins";
import { CmsContentModel } from "../../types";

export interface ContentModelPluginConfig {
    contentModel: CmsContentModel;
}

export class ContentModelPlugin extends Plugin {
    public static readonly type = "cms-content-model";
    private config: ContentModelPluginConfig;

    constructor(config: ContentModelPluginConfig) {
        super();
        this.config = config;
    }

    get contentModel(): CmsContentModel {
        return this.config.contentModel;
    }
}
