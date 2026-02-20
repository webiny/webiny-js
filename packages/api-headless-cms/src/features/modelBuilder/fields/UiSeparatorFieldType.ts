import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { IUiFieldBuilder, UiFieldBuilder } from "./UiFieldType.js";

class UiSeparatorFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "separator";

    public create(): IUiFieldBuilder {
        const builder = new UiFieldBuilder();
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
        separator(): IUiFieldBuilder;
    }
}
