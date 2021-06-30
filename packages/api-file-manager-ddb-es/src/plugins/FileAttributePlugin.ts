import { AttributePlugin, Params } from "@webiny/db-dynamodb/plugins/AttributePlugin";

export class FileAttributePlugin extends AttributePlugin {
    public constructor(params: Omit<Params, "entity">) {
        super({
            ...params,
            entity: "Files"
        });
    }
}
