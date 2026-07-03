import { FieldType, type IFieldTypeFactory, type IOptionsFieldBuilder } from "../abstractions.js";
import { FieldBuilder } from "../FieldBuilder.js";

export class PasswordFieldBuilder extends FieldBuilder<"password"> {
    constructor() {
        super("password");
        this._config.renderer = "passwordInput";
    }
}

class PasswordFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "password";
    create(_registry: any) {
        return new PasswordFieldBuilder();
    }
}

export const PasswordFieldType = FieldType.createImplementation({
    implementation: PasswordFieldTypeFactory,
    dependencies: []
});

declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        password(): IOptionsFieldBuilder<"password", string | null>;
    }
}
