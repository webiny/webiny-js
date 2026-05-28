import { createFeature } from "@webiny/feature/admin";
import { FormModelFactory as Abstraction } from "./abstractions.js";
import { FormModelFactory } from "./FormModelFactory.js";
import { ConditionRuleEvaluator } from "./ConditionRuleEvaluator.js";
import { FieldBuilderRegistry } from "./FieldBuilderRegistry.js";
import {
    TextFieldType,
    NumberFieldType,
    BooleanFieldType,
    DateTimeFieldType,
    FileFieldType,
    FileUrlFieldType,
    ObjectFieldType,
    LexicalFieldType
} from "./fieldTypes/index.js";

export const FormModelFeature = createFeature({
    name: "FormModel",
    register(container) {
        container.register(TextFieldType);
        container.register(NumberFieldType);
        container.register(BooleanFieldType);
        container.register(DateTimeFieldType);
        container.register(FileFieldType);
        container.register(FileUrlFieldType);
        container.register(ObjectFieldType);
        container.register(LexicalFieldType);

        container.register(FieldBuilderRegistry).inSingletonScope();
        container.register(ConditionRuleEvaluator).inSingletonScope();
        container.register(FormModelFactory).inSingletonScope();
    },
    resolve(container) {
        return {
            formModelFactory: container.resolve(Abstraction)
        };
    }
});
