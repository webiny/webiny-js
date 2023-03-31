import {
    ElasticsearchBodyModifierPlugin,
    ModifyBodyParams as BaseModifyBodyParams
} from "@webiny/api-elasticsearch";

export interface ModifyBodyParams extends BaseModifyBodyParams {
    where: Record<string, any>;
}

export class PageElasticsearchBodyModifierPlugin extends ElasticsearchBodyModifierPlugin<ModifyBodyParams> {
    public static override readonly type: string = "pageBuilder.elasticsearch.modifier.body.page";
}
