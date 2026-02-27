import { createImplementation } from "@webiny/feature/api";
import { FieldBuilder } from "./FieldBuilder.js";
import { FieldType, type IFieldTypeFactory } from "./abstractions.js";

export interface IUiFieldBuilder extends FieldBuilder<"ui" | `ui:${string}`> {}

// Module augmentation for TypeScript autocomplete
declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        ui(): IUiFieldBuilder;
    }
}

export class UiFieldBuilder extends FieldBuilder<"ui" | `ui:${string}`> implements IUiFieldBuilder {
    public constructor(subtype?: string) {
        const type = (subtype ? `ui:${subtype}` : "ui") as "ui" | `ui:${string}`;
        super(type);
    }
}

class UiFieldTypeFactory implements IFieldTypeFactory {
    public readonly type = "ui";

    public create(): IUiFieldBuilder {
        return new UiFieldBuilder();
    }
}

export const UiFieldType = createImplementation({
    abstraction: FieldType,
    implementation: UiFieldTypeFactory,
    dependencies: []
});
