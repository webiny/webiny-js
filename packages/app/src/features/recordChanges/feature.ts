import { createFeature } from "@webiny/feature/admin";
import { RecordChangeMessages } from "./RecordChangeMessages.js";

/**
 * Publishes a `RecordChangedEvent` for every record-changed message from the api. Register it once,
 * in the container the websocket bridge publishes from; registered twice, every event goes out twice.
 */
export const RecordChangesFeature = createFeature({
    name: "App/RecordChanges",
    register(container) {
        container.register(RecordChangeMessages);
    }
});
