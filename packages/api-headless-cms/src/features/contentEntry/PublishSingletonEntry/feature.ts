import { createFeature } from "@webiny/feature/api";
import { PublishSingletonEntryUseCase } from "./PublishSingletonEntryUseCase.js";

/**
 * PublishSingletonEntry Feature
 *
 * Publishes a singleton entry revision.
 */
export const PublishSingletonEntryFeature = createFeature({
    name: "PublishSingletonEntry",
    register(container) {
        container.register(PublishSingletonEntryUseCase);
    }
});
