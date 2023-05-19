import {
    AttributePlugin,
    AttributePluginParams
} from "@webiny/db-dynamodb/plugins/definitions/AttributePlugin";

export class FileAttributePlugin extends AttributePlugin {
    public constructor(params: Omit<AttributePluginParams, "entity">) {
        super({
            ...params,
            entity: "FM.File"
        });
    }
}
