import { createFeature } from "@webiny/feature/admin";
import { RefreshChangedEntryInCache } from "./RefreshChangedEntryInCache.js";
import { RemoveDeletedEntryFromCache } from "./RemoveDeletedEntryFromCache.js";
import { EntryWebsocketMessages } from "./EntryWebsocketMessages.js";

/**
 * Keeps the entries lists current when the assistant creates, changes or deletes entries. Register it
 * once, in the container the websocket bridge publishes from, alongside `ContentEntryFeature` and
 * `ModelFeature`, whose `GetEntryUseCase` and `GetModelUseCase` the refresh handler uses.
 */
export const EntryEventsFeature = createFeature({
    name: "Cms/EntryEvents",
    register(container) {
        container.register(RefreshChangedEntryInCache);
        container.register(RemoveDeletedEntryFromCache);
        container.register(EntryWebsocketMessages);
    }
});
