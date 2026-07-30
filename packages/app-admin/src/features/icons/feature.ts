import { createFeature } from "@webiny/feature/admin";
import { IconRegistry } from "./IconRegistry.js";
import { IconRegistry as IconRegistryAbstraction } from "./abstractions.js";

export const IconRegistryFeature = createFeature({
    name: "IconRegistry",
    register(container) {
        container.register(IconRegistry).inSingletonScope();
    },
    resolve(container) {
        return {
            registry: container.resolve(IconRegistryAbstraction)
        };
    }
});
