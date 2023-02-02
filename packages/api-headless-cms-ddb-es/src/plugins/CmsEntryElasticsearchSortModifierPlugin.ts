import {
    ElasticsearchSortModifierPlugin,
    ModifySortCallable,
    ModifySortParams as BaseModifySortParams
} from "@webiny/api-elasticsearch";
import { CmsModel } from "@webiny/api-headless-cms/types";

export interface ModifySortParams extends BaseModifySortParams {
    model: CmsModel;
}

export interface CmsEntryElasticsearchSortModifierPluginConfig {
    modifySort: ModifySortCallable<ModifySortParams>;
    /**
     * If modelId is not passed, there is no filtering of plugins by it when plugin is applied during the runtime.
     */
    modelId?: string;
}

export class CmsEntryElasticsearchSortModifierPlugin extends ElasticsearchSortModifierPlugin<ModifySortParams> {
    public static override readonly type: string = "cms.elasticsearch.modifier.sort.entry";

    public readonly modelId?: string;

    public constructor(config: CmsEntryElasticsearchSortModifierPluginConfig) {
        super(config.modifySort);
        this.modelId = config.modelId;
    }
}

export const createCmsEntryElasticsearchSortModifierPlugin = (
    config: CmsEntryElasticsearchSortModifierPluginConfig
) => {
    return new CmsEntryElasticsearchSortModifierPlugin(config);
};
