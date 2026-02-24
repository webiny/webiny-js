import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { IUiFieldBuilder, UiFieldBuilder } from "./UiFieldType.js";

class UiAlertFieldTypeFactory implements IFieldTypeFactory {
    public readonly type = "ui:alert";

    public create(): IUiFieldBuilder {
        const builder = new UiFieldBuilder("alert");
        return builder
            .renderer("uiAlert", {
                type: "warning"
            })
            .label("Alert!");
    }
}

export const UiAlertFieldType = FieldType.createImplementation({
    implementation: UiAlertFieldTypeFactory,
    dependencies: []
});

// Module augmentation for TypeScript autocomplete
declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        uiAlert(): IUiFieldBuilder;
    }
}
