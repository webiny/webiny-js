import { EntryAfterMoveEventHandler } from "@webiny/api-headless-cms/features/contentEntry/MoveEntry/index.js";
import { EntryActivityRecorder } from "~/cms/recorder/abstractions.js";

/**
 * A folder move. Changes no field values, so no changeset.
 */
class RecordEntryMovedImpl implements EntryAfterMoveEventHandler.Interface {
    constructor(private recorder: EntryActivityRecorder.Interface) {}

    async handle(event: EntryAfterMoveEventHandler.Event): Promise<void> {
        await this.recorder.record({
            model: event.payload.model,
            entry: event.payload.entry,
            action: "entry.move"
        });
    }
}

export const RecordEntryMoved = EntryAfterMoveEventHandler.createImplementation({
    implementation: RecordEntryMovedImpl,
    dependencies: [EntryActivityRecorder]
});
