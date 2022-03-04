import {
    AttributePlugin,
    AttributePluginParams
} from "@webiny/db-dynamodb/plugins/definitions/AttributePlugin";

export class FileElasticsearchAttributePlugin extends AttributePlugin {
    public constructor(params: Omit<AttributePluginParams, "entity">) {
        super({
            ...params,
            entity: "FilesElasticsearch"
        });
    }
}
