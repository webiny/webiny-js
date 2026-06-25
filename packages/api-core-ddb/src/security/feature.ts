import { createFeature } from "@webiny/feature/api";
import { SecurityStorageOperations } from "./SecurityStorageOperations.js";

export const SecurityApiCoreDdbFeature = createFeature({
    name: "ApiCoreDdb/Security",
    register: container => {
        container.register(SecurityStorageOperations).inSingletonScope();
    }
});
