import { FieldType, type IFieldTypeFactory, type IOptionsFieldBuilder } from "../abstractions.js";
import { FieldBuilder } from "../FieldBuilder.js";

export class TextFieldBuilder extends FieldBuilder<"text"> {
    constructor() {
        super("text");
        this._config.renderer = "textInput";
    }
}

class TextFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "text";
    create(_registry: any) {
        return new TextFieldBuilder();
    }
}

export const TextFieldType = FieldType.createImplementation({
    implementation: TextFieldTypeFactory,
    dependencies: []
});

declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        text(): IOptionsFieldBuilder<"text", string | null>;
    }
}
