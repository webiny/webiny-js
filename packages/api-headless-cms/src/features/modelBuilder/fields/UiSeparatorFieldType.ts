import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { type LayoutFieldBuildResult } from "./FieldBuilder.js";
import { UiFieldBuilder } from "./UiFieldType.js";

export interface IUiSeparatorFieldBuilder extends UiFieldBuilder {
    list(): this;
}

class SeparatorFieldBuilder extends UiFieldBuilder implements IUiSeparatorFieldBuilder {
    public constructor() {
        super("separator");
    }

    public override list(): this {
        return this;
    }

    public override build(): LayoutFieldBuildResult {
        return {
            type: "layout",
            layoutCell: {
                type: "separator",
                label: this.config.label
            }
        };
    }
}

class UiSeparatorFieldTypeFactory implements IFieldTypeFactory {
    public readonly type = "ui:separator";

    public create(): IUiSeparatorFieldBuilder {
        return new SeparatorFieldBuilder();
    }
}

export const UiSeparatorFieldType = FieldType.createImplementation({
    implementation: UiSeparatorFieldTypeFactory,
    dependencies: []
});

// Module augmentation for TypeScript autocomplete
declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        uiSeparator(): IUiSeparatorFieldBuilder;
    }
}
