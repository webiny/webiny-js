import { createFeature } from "@webiny/feature/api/index.js";
import { DbRegistry } from "./DbRegistry.js";

export const DbRegistryFeature = createFeature({
    name: "DbRegistry",
    register: container => {
        container.register(DbRegistry).inSingletonScope();
    }
});
