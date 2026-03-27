import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
import { BuildParams as Abstraction } from "./abstractions.js";
import { BuildParams } from "./BuildParams.js";

export const BuildParamsFeature = createFeature({
    name: "BuildParamsFeature",
    register(container: Container) {
        container.register(BuildParams);
    },
    resolve(container) {
        return container.resolve(Abstraction);
    }
});
