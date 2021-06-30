import { AttributePlugin, Params } from "@webiny/db-dynamodb/plugins/AttributePlugin";

export class SettingsAttributePlugin extends AttributePlugin {
    public constructor(params: Omit<Params, "entity">) {
        super({
            ...params,
            entity: "Settings"
        });
    }
}
