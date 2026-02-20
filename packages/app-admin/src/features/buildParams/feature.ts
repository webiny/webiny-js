import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
import { BuildParams } from "./BuildParams.js";
import { BuildParams as BuildParamsAbstraction } from "./abstractions.js";

export const BuildParamsFeature = createFeature({
    name: "BuildParamsFeature",
    register(container: Container) {
        container.register(BuildParams);
    },
    resolve(container: Container) {
        return container.resolve(BuildParamsAbstraction);
    }
});
