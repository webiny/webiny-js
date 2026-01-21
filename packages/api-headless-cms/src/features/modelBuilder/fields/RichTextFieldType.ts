import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { FieldBuilder } from "./FieldBuilder.js";

export interface IRichTextFieldBuilder extends FieldBuilder<"rich-text"> {
    required(message?: string): this;
}

class RichTextFieldBuilder extends FieldBuilder<"rich-text"> implements IRichTextFieldBuilder {
    public constructor() {
        super("rich-text");
    }

    required(message?: string): this {
        return this.validation({
            name: "required",
            message: message || "Field is required",
            settings: {}
        });
    }
}

class RichTextFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "rich-text";

    create(): IRichTextFieldBuilder {
        return new RichTextFieldBuilder();
    }
}

export const RichTextFieldType = FieldType.createImplementation({
    implementation: RichTextFieldTypeFactory,
    dependencies: []
});

// Module augmentation for TypeScript autocomplete
declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        "rich-text"(): IRichTextFieldBuilder;
        richText(): IRichTextFieldBuilder;
    }
}
