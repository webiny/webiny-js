import {
    ElasticsearchBodyModifierPlugin,
    ModifyBodyCallable,
    ModifyBodyParams as BaseModifyBodyParams
} from "@webiny/api-elasticsearch";
import { CmsModel } from "@webiny/api-headless-cms/types";

export interface ModifyBodyParams extends BaseModifyBodyParams {
    model: CmsModel;
    where: {
        [key: string]: any;
    };
}

export interface CmsEntryElasticsearchBodyModifierPluginConfig {
    modifyBody: ModifyBodyCallable<ModifyBodyParams>;
    /**
     * If modelId is not passed, there is no filtering of plugins by it when plugin is applied during the runtime.
     */
    modelId?: string;
}

export class CmsEntryElasticsearchBodyModifierPlugin extends ElasticsearchBodyModifierPlugin<ModifyBodyParams> {
    public static override readonly type: string = "cms.elasticsearch.modifier.body.entry";

    public readonly modelId?: string;

    public constructor(config: CmsEntryElasticsearchBodyModifierPluginConfig) {
        super(config.modifyBody);

        this.modelId = config.modelId;
    }
}

export const createCmsEntryElasticsearchBodyModifierPlugin = (
    config: CmsEntryElasticsearchBodyModifierPluginConfig
) => {
    return new CmsEntryElasticsearchBodyModifierPlugin(config);
};
