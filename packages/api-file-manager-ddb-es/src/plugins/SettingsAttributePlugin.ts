import { DynamoDbAttributePlugin } from "@webiny/db-dynamodb/plugins";
import { DynamoDbAttributePluginArgs } from "@webiny/db-dynamodb/types";

export class SettingsAttributePlugin extends DynamoDbAttributePlugin {
    public constructor(params: Omit<DynamoDbAttributePluginArgs, "entity">) {
        super({
            ...params,
            entity: "Settings"
        });
    }
}
