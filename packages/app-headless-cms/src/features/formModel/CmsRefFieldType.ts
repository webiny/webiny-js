import {
    FieldType,
    type IFieldTypeFactory
} from "@webiny/app-admin/features/formModel/abstractions.js";
import { FieldBuilder } from "@webiny/app-admin/features/formModel/FieldBuilder.js";

class RefFieldBuilder extends FieldBuilder<"ref"> {
    constructor() {
        super("ref");
        this._config.renderer = "refInput";
    }
}

class RefFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "ref";
    create() {
        return new RefFieldBuilder();
    }
}

export const CmsRefFieldType = FieldType.createImplementation({
    implementation: RefFieldTypeFactory,
    dependencies: []
});

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldBuilderRegistry {
        ref(): IFieldBuilder<"ref", false, Record<string, unknown> | null>;
    }
}
