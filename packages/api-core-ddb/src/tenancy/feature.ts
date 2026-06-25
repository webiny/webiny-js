import { createFeature } from "@webiny/feature/api";
import { TenancyStorageOperations } from "./TenancyStorageOperations.js";

export const TenancyApiCoreDdbFeature = createFeature({
    name: "ApiCoreDdb/Tenancy",
    register: container => {
        container.register(TenancyStorageOperations).inSingletonScope();
    }
});
