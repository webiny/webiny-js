import { AttributePlugin, Params } from "@webiny/db-dynamodb/plugins/definitions/AttributePlugin";

export class PageDynamoDbAttributePlugin extends AttributePlugin {
    public constructor(params: Omit<Params, "entity">) {
        super({
            ...params,
            entity: "PbPage"
        });
    }
}
