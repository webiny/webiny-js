import {
    ElasticsearchSortModifierPlugin,
    ModifySortParams as BaseModifySortParams
} from "@webiny/api-elasticsearch";

export interface ModifySortParams extends BaseModifySortParams {
    where: Record<string, any>;
}

export class PageElasticsearchSortModifierPlugin extends ElasticsearchSortModifierPlugin<ModifySortParams> {
    public static override readonly type: string = "pageBuilder.elasticsearch.modifier.sort.page";
}
