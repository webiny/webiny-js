import { createFeature } from "@webiny/feature/api";
import { EntryEventPublisher } from "./EntryEventPublisher.js";

export const EntryEventPublisherFeature = createFeature({
    name: "EntryEventPublisher",
    register(container) {
        container.register(EntryEventPublisher);
    }
});
