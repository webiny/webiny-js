import { EntryAfterCreateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { EntryActivityRecorder } from "~/cms/recorder/abstractions.js";

/**
 * A create has no before-state, so it carries no changeset: the action is the information. Listing every populated field would bury the timeline and, past the cap, roll up to nothing useful anyway.
 */
class RecordEntryCreatedImpl implements EntryAfterCreateEventHandler.Interface {
    constructor(private recorder: EntryActivityRecorder.Interface) {}

    async handle(event: EntryAfterCreateEventHandler.Event): Promise<void> {
        await this.recorder.record({
            model: event.payload.model,
            entry: event.payload.entry,
            action: "entry.create"
        });
    }
}

export const RecordEntryCreated = EntryAfterCreateEventHandler.createImplementation({
    implementation: RecordEntryCreatedImpl,
    dependencies: [EntryActivityRecorder]
});
