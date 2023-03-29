import {
    ElasticsearchQueryModifierPlugin,
    ModifyQueryParams as BaseModifyQueryParams
} from "@webiny/api-elasticsearch";
import { SortType } from "@webiny/api-elasticsearch/types";

export interface ModifyQueryParams extends BaseModifyQueryParams {
    limit: number;
    sort: SortType;
}

export class PageElasticsearchQueryModifierPlugin extends ElasticsearchQueryModifierPlugin<ModifyQueryParams> {
    public static override readonly type: string = "pageBuilder.elasticsearch.modifier.query.page";
}
