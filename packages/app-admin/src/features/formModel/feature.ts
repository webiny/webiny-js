import { createFeature } from "@webiny/feature/admin";
import { FormModelFactory as Abstraction } from "./abstractions.js";
import { FormModelFactory } from "./FormModelFactory.js";

export const FormModelFeature = createFeature({
    name: "FormModel",
    register(container) {
        container.register(FormModelFactory).inSingletonScope();
    },
    resolve(container) {
        return {
            formModelFactory: container.resolve(Abstraction)
        };
    }
});
