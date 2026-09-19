import { EntryRevisionAfterCreateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/index.js";
import { EntryActivityRecorder } from "~/cms/recorder/abstractions.js";

/**
 * A new revision diffs against the revision it was created from, which is what makes the first record on a fresh revision meaningful rather than empty.
 */
class RecordEntryRevisionCreatedImpl implements EntryRevisionAfterCreateEventHandler.Interface {
    constructor(private recorder: EntryActivityRecorder.Interface) {}

    async handle(event: EntryRevisionAfterCreateEventHandler.Event): Promise<void> {
        await this.recorder.record({
            model: event.payload.model,
            entry: event.payload.entry,
            action: "entry.revision.create",
            original: event.payload.original
        });
    }
}

export const RecordEntryRevisionCreated = EntryRevisionAfterCreateEventHandler.createImplementation(
    {
        implementation: RecordEntryRevisionCreatedImpl,
        dependencies: [EntryActivityRecorder]
    }
);
