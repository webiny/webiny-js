import { EntryAfterRestoreFromBinEventHandler } from "@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin/index.js";
import { EntryActivityRecorder } from "~/cms/recorder/abstractions.js";

/**
 * Brought back out of the bin. Note the asymmetry with trashing, which shares the delete event rather than having its own.
 */
class RecordEntryRestoredImpl implements EntryAfterRestoreFromBinEventHandler.Interface {
    constructor(private recorder: EntryActivityRecorder.Interface) {}

    async handle(event: EntryAfterRestoreFromBinEventHandler.Event): Promise<void> {
        await this.recorder.record({
            model: event.payload.model,
            entry: event.payload.entry,
            action: "entry.restore"
        });
    }
}

export const RecordEntryRestored = EntryAfterRestoreFromBinEventHandler.createImplementation({
    implementation: RecordEntryRestoredImpl,
    dependencies: [EntryActivityRecorder]
});
