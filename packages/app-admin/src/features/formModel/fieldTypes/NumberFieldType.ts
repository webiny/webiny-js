import { FieldType, type IFieldTypeFactory } from "../abstractions.js";
import { FieldBuilder } from "../FieldBuilder.js";

export class NumberFieldBuilder extends FieldBuilder<"number"> {
    constructor() {
        super("number");
        this._config.renderer = "numberInput";
    }

    override normalizeValue(value: unknown): unknown {
        if (value === null || value === undefined || value === "") {
            return null;
        }

        const n = Number(value);

        return Number.isNaN(n) ? null : n;
    }
}

class NumberFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "number";
    create() {
        return new NumberFieldBuilder();
    }
}

export const NumberFieldType = FieldType.createImplementation({
    implementation: NumberFieldTypeFactory,
    dependencies: []
});

declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        number(): IOptionsFieldBuilder<"number", number | null>;
    }
}
