import { createImplementation } from "@webiny/feature/api";
import { FieldBuilder } from "./FieldBuilder.js";
import { FieldType, type IFieldTypeFactory } from "./abstractions.js";

export interface IUiFieldBuilder extends FieldBuilder<"ui"> {}

// Module augmentation for TypeScript autocomplete
declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        ui(): IUiFieldBuilder;
    }
}

class UiFieldBuilder extends FieldBuilder<"ui"> implements IUiFieldBuilder {
    public constructor() {
        super("ui");
    }
}

class UiFieldTypeFactory implements IFieldTypeFactory {
    public readonly type = "ui";

    public create(): IUiFieldBuilder {
        return new UiFieldBuilder();
    }
}

export const UiFieldType = createImplementation({
    abstraction: FieldType,
    implementation: UiFieldTypeFactory,
    dependencies: []
});
