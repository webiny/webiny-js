import { AttributePlugin, Params } from "@webiny/db-dynamodb/plugins/definitions/AttributePlugin";

export class LocalesAttributePlugin extends AttributePlugin {
    public constructor(params: Omit<Params, "entity">) {
        super({
            ...params,
            entity: "I18NLocale"
        });
    }
}
