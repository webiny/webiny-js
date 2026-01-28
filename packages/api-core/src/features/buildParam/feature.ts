import { createFeature } from "@webiny/feature/api";
import { Container } from "@webiny/di";
import { BuildParamRegistry as BuildParamRegistryAbstraction } from "./abstractions.js";
import { BuildParamRegistry } from "./BuildParamRegistry.js";

export const BuildParamFeature = createFeature({
    name: "BuildParamFeature",
    register(container: Container) {
        container.registerInstance(
            BuildParamRegistryAbstraction,
            new BuildParamRegistry(container)
        );
    }
});
