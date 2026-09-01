import { z } from "zod";
import { FieldType, type IFieldTypeFactory } from "../abstractions.js";
import { FieldBuilder } from "../FieldBuilder.js";

const permissionsSchema = z
    .array(z.record(z.string(), z.unknown()))
    .min(1, "You must configure permissions before saving.");

export class PermissionsFieldBuilder extends FieldBuilder<"permissions"> {
    constructor() {
        super("permissions");
        this._config.renderer = "permissions";
        this._config.defaultValue = [];
        this._config.schema = permissionsSchema;
    }
}

class PermissionsFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "permissions";
    create(_registry: any) {
        return new PermissionsFieldBuilder();
    }
}

export const PermissionsFieldType = FieldType.createImplementation({
    implementation: PermissionsFieldTypeFactory,
    dependencies: []
});

declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        permissions(): IFieldBuilder<"permissions", false, unknown>;
    }
}
