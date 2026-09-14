import { EntryAfterUpdateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { EntryActivityRecorder } from "~/cms/recorder/abstractions.js";

/**
 * The ordinary save, and the only event that routinely produces a changeset.
 */
class RecordEntryUpdatedImpl implements EntryAfterUpdateEventHandler.Interface {
    constructor(private recorder: EntryActivityRecorder.Interface) {}

    async handle(event: EntryAfterUpdateEventHandler.Event): Promise<void> {
        await this.recorder.record({
            model: event.payload.model,
            entry: event.payload.entry,
            action: "entry.update",
            original: event.payload.original
        });
    }
}

export const RecordEntryUpdated = EntryAfterUpdateEventHandler.createImplementation({
    implementation: RecordEntryUpdatedImpl,
    dependencies: [EntryActivityRecorder]
});
