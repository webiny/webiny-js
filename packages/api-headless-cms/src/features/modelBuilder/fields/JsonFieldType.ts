import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { FieldBuilder } from "./FieldBuilder.js";

export interface IJsonFieldBuilder extends FieldBuilder<"json"> {}

class JsonFieldBuilder extends FieldBuilder<"json"> implements IJsonFieldBuilder {
    constructor() {
        super("json");
    }
}

class JsonFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "json";

    create(): IJsonFieldBuilder {
        return new JsonFieldBuilder();
    }
}

export const JsonFieldType = FieldType.createImplementation({
    implementation: JsonFieldTypeFactory,
    dependencies: []
});

// Module augmentation for TypeScript autocomplete
declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        json(): IJsonFieldBuilder;
    }
}
