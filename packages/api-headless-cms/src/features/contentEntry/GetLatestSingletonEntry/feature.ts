import { createFeature } from "@webiny/feature/api";
import { GetLatestSingletonEntryUseCase } from "./GetLatestSingletonEntryUseCase.js";

/**
 * GetLatestSingletonEntry Feature
 *
 * Gets the latest revision of the singleton entry, creating it if missing.
 */
export const GetLatestSingletonEntryFeature = createFeature({
    name: "GetLatestSingletonEntry",
    register(container) {
        container.register(GetLatestSingletonEntryUseCase);
    }
});
