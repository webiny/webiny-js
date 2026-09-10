import { EntryRevisionAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/index.js";
import { EntryActivityRecorder } from "~/cms/recorder/abstractions.js";

/**
 * One revision discarded. No before-state is carried, and none would help.
 */
class RecordEntryRevisionDeletedImpl implements EntryRevisionAfterDeleteEventHandler.Interface {
    constructor(private recorder: EntryActivityRecorder.Interface) {}

    async handle(event: EntryRevisionAfterDeleteEventHandler.Event): Promise<void> {
        await this.recorder.record({
            model: event.payload.model,
            entry: event.payload.entry,
            action: "entry.revision.delete"
        });
    }
}

export const RecordEntryRevisionDeleted = EntryRevisionAfterDeleteEventHandler.createImplementation(
    {
        implementation: RecordEntryRevisionDeletedImpl,
        dependencies: [EntryActivityRecorder]
    }
);
