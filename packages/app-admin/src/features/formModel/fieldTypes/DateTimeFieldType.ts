import { FieldType, type IFieldTypeFactory, type IFieldBuilder } from "../abstractions.js";
import { FieldBuilder } from "../FieldBuilder.js";

export class DateTimeFieldBuilder extends FieldBuilder<"datetime"> {
    constructor() {
        super("datetime");
        this._config.renderer = "dateTimeInput";
    }
}

class DateTimeFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "datetime";
    create(_registry: any) {
        return new DateTimeFieldBuilder();
    }
}

export const DateTimeFieldType = FieldType.createImplementation({
    implementation: DateTimeFieldTypeFactory,
    dependencies: []
});

declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        datetime(): IFieldBuilder<"datetime", false, string | null>;
    }
}
