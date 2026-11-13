import { createFeature } from "@webiny/feature/admin";
import { ApplyEntryChangeToCache } from "./ApplyEntryChangeToCache.js";

/**
 * Keeps the entries lists current when the assistant creates, changes or deletes entries. Register it
 * once, in the container `RecordChangesFeature` publishes from, alongside `ContentEntryFeature` and
 * `ModelFeature`, whose `GetEntryUseCase` and `GetModelUseCase` the handler uses.
 */
export const EntryEventsFeature = createFeature({
    name: "Cms/EntryEvents",
    register(container) {
        container.register(ApplyEntryChangeToCache);
    }
});
