import { FieldType, type IFieldTypeFactory } from "../abstractions.js";
import { FieldBuilder } from "../FieldBuilder.js";

export class BooleanFieldBuilder extends FieldBuilder<"boolean"> {
    constructor() {
        super("boolean");
        this._config.renderer = "switch";
    }

    override normalizeValue(value: unknown): unknown {
        return Boolean(value);
    }
}

class BooleanFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "boolean";
    create() {
        return new BooleanFieldBuilder();
    }
}

export const BooleanFieldType = FieldType.createImplementation({
    implementation: BooleanFieldTypeFactory,
    dependencies: []
});

declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        boolean(): IFieldBuilder<"boolean", false, boolean | null>;
    }
}
