import { AttributePlugin, Params } from "@webiny/db-dynamodb/plugins";

export class FileElasticsearchAttributePlugin extends AttributePlugin {
    public constructor(params: Omit<Params, "entity">) {
        super({
            ...params,
            entity: "FilesElasticsearch"
        });
    }
}
