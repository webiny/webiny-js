import { AttributePlugin, Params } from "@webiny/db-dynamodb/plugins/definitions/AttributePlugin";

export class SystemAttributePlugin extends AttributePlugin {
    public constructor(params: Omit<Params, "entity">) {
        super({
            ...params,
            entity: "I18NSystem"
        });
    }
}
