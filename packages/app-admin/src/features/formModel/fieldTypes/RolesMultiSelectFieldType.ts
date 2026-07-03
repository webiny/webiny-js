import { FieldType, type IFieldTypeFactory } from "../abstractions.js";
import { FieldBuilder } from "../FieldBuilder.js";

export class RolesMultiSelectFieldBuilder extends FieldBuilder<"rolesMultiSelect"> {
    constructor() {
        super("rolesMultiSelect");
        this._config.renderer = "rolesMultiSelect";
        this._config.defaultValue = [];
    }
}

class RolesMultiSelectFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "rolesMultiSelect";
    create(_registry: any) {
        return new RolesMultiSelectFieldBuilder();
    }
}

export const RolesMultiSelectFieldType = FieldType.createImplementation({
    implementation: RolesMultiSelectFieldTypeFactory,
    dependencies: []
});

declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        rolesMultiSelect(): IFieldBuilder<"rolesMultiSelect", false, unknown>;
    }
}
