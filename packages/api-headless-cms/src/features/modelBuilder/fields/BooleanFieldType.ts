import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { DataFieldBuilder } from "./FieldBuilder.js";

export interface IBooleanFieldBuilder extends DataFieldBuilder<"boolean"> {
    defaultValue(value: boolean): this;
}

class BooleanFieldBuilder extends DataFieldBuilder<"boolean"> implements IBooleanFieldBuilder {
    public constructor() {
        super("boolean");
    }

    override defaultValue(value: boolean): this {
        this.config.settings = this.config.settings || {};
        this.config.settings.defaultValue = value;
        return this;
    }
}

class BooleanFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "boolean";

    create(): IBooleanFieldBuilder {
        return new BooleanFieldBuilder();
    }
}

export const BooleanFieldType = FieldType.createImplementation({
    implementation: BooleanFieldTypeFactory,
    dependencies: []
});

// Module augmentation for TypeScript autocomplete
declare module "../abstractions.js" {
    namespace FieldBuilderRegistry {
        interface Interface {
            boolean(): IBooleanFieldBuilder;
        }
    }
}
