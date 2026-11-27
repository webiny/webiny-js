import { createFeature } from "@webiny/feature/api";
import { GetPublishedSingletonEntryUseCase } from "./GetPublishedSingletonEntryUseCase.js";

/**
 * GetPublishedSingletonEntry Feature
 *
 * Gets the published revision of the singleton entry, creating it if missing.
 */
export const GetPublishedSingletonEntryFeature = createFeature({
    name: "GetPublishedSingletonEntry",
    register(container) {
        container.register(GetPublishedSingletonEntryUseCase);
    }
});
