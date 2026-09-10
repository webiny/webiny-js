import { EntryAfterRepublishEventHandler } from "@webiny/api-headless-cms/features/contentEntry/RepublishEntry/index.js";
import { EntryActivityRecorder } from "~/cms/recorder/abstractions.js";

/**
 * Republish carries no original in its payload, so no changeset is possible here even though the operation can refresh references.
 */
class RecordEntryRepublishedImpl implements EntryAfterRepublishEventHandler.Interface {
    constructor(private recorder: EntryActivityRecorder.Interface) {}

    async handle(event: EntryAfterRepublishEventHandler.Event): Promise<void> {
        await this.recorder.record({
            model: event.payload.model,
            entry: event.payload.entry,
            action: "entry.republish"
        });
    }
}

export const RecordEntryRepublished = EntryAfterRepublishEventHandler.createImplementation({
    implementation: RecordEntryRepublishedImpl,
    dependencies: [EntryActivityRecorder]
});
