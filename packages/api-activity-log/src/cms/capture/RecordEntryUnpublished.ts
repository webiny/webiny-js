import { EntryAfterUnpublishEventHandler } from "@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/index.js";
import { EntryActivityRecorder } from "~/cms/recorder/abstractions.js";

/**
 * A status transition, not a content change.
 */
class RecordEntryUnpublishedImpl implements EntryAfterUnpublishEventHandler.Interface {
    constructor(private recorder: EntryActivityRecorder.Interface) {}

    async handle(event: EntryAfterUnpublishEventHandler.Event): Promise<void> {
        await this.recorder.record({
            model: event.payload.model,
            entry: event.payload.entry,
            action: "entry.unpublish"
        });
    }
}

export const RecordEntryUnpublished = EntryAfterUnpublishEventHandler.createImplementation({
    implementation: RecordEntryUnpublishedImpl,
    dependencies: [EntryActivityRecorder]
});
