import { createFeature } from "@webiny/feature/api";
import { Container } from "@webiny/di";
import { BuildParams } from "./BuildParams.js";

export const BuildParamsFeature = createFeature({
    name: "BuildParamsFeature",
    register(container: Container) {
        container.register(BuildParams);
    }
});
