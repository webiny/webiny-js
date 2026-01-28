import { createFeature } from "@webiny/feature/api";
import { Container } from "@webiny/di";
import { BuildParams as BuildParamsAbstraction } from "./abstractions.js";
import { BuildParamsImpl } from "./BuildParams.js";

export const BuildParamsFeature = createFeature({
    name: "BuildParamsFeature",
    register(container: Container) {
        container.registerInstance(BuildParamsAbstraction, new BuildParamsImpl(container));
    }
});
