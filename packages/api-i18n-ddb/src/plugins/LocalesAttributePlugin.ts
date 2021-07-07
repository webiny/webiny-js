import { AttributePlugin, Params } from "@webiny/db-dynamodb/plugins/AttributePlugin";

export class LocalesAttributePlugin extends AttributePlugin {
    public constructor(params: Omit<Params, "entity">) {
        super({
            ...params,
            entity: "I18NLocales"
        });
    }
}
