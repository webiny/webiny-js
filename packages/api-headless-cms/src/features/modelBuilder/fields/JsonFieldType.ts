import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { DataFieldBuilder } from "./FieldBuilder.js";

export interface IJsonFieldBuilder extends DataFieldBuilder<"json"> {}

class JsonFieldBuilder extends DataFieldBuilder<"json"> implements IJsonFieldBuilder {
    public constructor() {
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
