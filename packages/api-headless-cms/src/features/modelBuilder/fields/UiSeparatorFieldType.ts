import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { type LayoutFieldBuildResult } from "./BaseFieldBuilder.js";
import { LayoutFieldBuilder } from "./LayoutFieldBuilder.js";

export interface IUiSeparatorFieldBuilder extends LayoutFieldBuilder<"uiSeparator"> {}

class SeparatorFieldBuilder
    extends LayoutFieldBuilder<"uiSeparator">
    implements IUiSeparatorFieldBuilder
{
    public constructor() {
        super("uiSeparator");
    }

    public override build(): LayoutFieldBuildResult {
        return {
            type: "layout",
            layoutCell: {
                type: "separator",
                label: this.config.label,
                description: this.config.description
            }
        };
    }
}

class UiSeparatorFieldTypeFactory implements IFieldTypeFactory {
    public readonly type = "uiSeparator";

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
