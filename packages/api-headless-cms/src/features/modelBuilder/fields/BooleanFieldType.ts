import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { FieldBuilder } from "./FieldBuilder.js";
import type { IFieldBuilderRegistry } from "../abstractions.js";

export interface IBooleanFieldBuilder extends FieldBuilder<"boolean"> {
    defaultValue(value: boolean): this;
}

class BooleanFieldBuilder extends FieldBuilder<"boolean"> implements IBooleanFieldBuilder {
    constructor() {
        super("boolean");
    }

    defaultValue(value: boolean): this {
        this.config.settings = this.config.settings || {};
        this.config.settings.defaultValue = value;
        return this;
    }
}

class BooleanFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "boolean";

    create(_registry: IFieldBuilderRegistry): IBooleanFieldBuilder {
        return new BooleanFieldBuilder();
    }
}

export const BooleanFieldType = FieldType.createImplementation({
    implementation: BooleanFieldTypeFactory,
    dependencies: []
});

// Module augmentation for TypeScript autocomplete
declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        boolean(): IBooleanFieldBuilder;
    }
}
