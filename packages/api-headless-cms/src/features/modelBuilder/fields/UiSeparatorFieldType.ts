import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { IUiFieldBuilder, UiFieldBuilder } from "./UiFieldType.js";

class UiSeparatorFieldTypeFactory implements IFieldTypeFactory {
    public readonly type = "ui:separator";

    public create(): IUiFieldBuilder {
        const builder = new UiFieldBuilder("separator");
        return builder.renderer("uiSeparator").label("Separator");
    }
}

export const UiSeparatorFieldType = FieldType.createImplementation({
    implementation: UiSeparatorFieldTypeFactory,
    dependencies: []
});

// Module augmentation for TypeScript autocomplete
declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        uiSeparator(): IUiFieldBuilder;
    }
}
