import { createFeature } from "@webiny/feature/admin";
import { FormModelFactory as Abstraction } from "./abstractions.js";
import { FormModelFactory } from "./FormModelFactory.js";
import { ConditionRuleEvaluatorImpl } from "./ConditionRuleEvaluator.js";

export const FormModelFeature = createFeature({
    name: "FormModel",
    register(container) {
        container.register(ConditionRuleEvaluatorImpl).inSingletonScope();
        container.register(FormModelFactory).inSingletonScope();
    },
    resolve(container) {
        return {
            formModelFactory: container.resolve(Abstraction)
        };
    }
});
