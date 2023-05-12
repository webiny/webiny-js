import {
    ElasticsearchQueryModifierPlugin,
    ModifyQueryCallable,
    ModifyQueryParams as BaseModifyQueryParams
} from "@webiny/api-elasticsearch";
import { CmsModel } from "@webiny/api-headless-cms/types";

export interface ModifyQueryParams extends BaseModifyQueryParams {
    model: CmsModel;
}

export interface CmsEntryElasticsearchQueryModifierPluginConfig {
    modifyQuery: ModifyQueryCallable<ModifyQueryParams>;
    /**
     * If modelId is not passed, there is no filtering of plugins by it when plugin is applied during the runtime.
     */
    modelId?: string;
}

export class CmsEntryElasticsearchQueryModifierPlugin extends ElasticsearchQueryModifierPlugin<ModifyQueryParams> {
    public static override readonly type: string = "cms.elasticsearch.modifier.query.entry";

    public readonly modelId?: string;

    public constructor(config: CmsEntryElasticsearchQueryModifierPluginConfig) {
        super(config.modifyQuery);

        this.modelId = config.modelId;
    }
}

export const createCmsEntryElasticsearchQueryModifierPlugin = (
    config: CmsEntryElasticsearchQueryModifierPluginConfig
) => {
    return new CmsEntryElasticsearchQueryModifierPlugin(config);
};
