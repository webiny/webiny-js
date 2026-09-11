import { EntryAfterPublishEventHandler } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/index.js";
import { EntryActivityRecorder } from "~/cms/recorder/abstractions.js";

/**
 * Publishing does not normally change field values, so the changeset is usually empty. The original is passed anyway rather than assumed empty, so that a publish which does alter values (a republish refreshing references, for instance) reports them.
 */
class RecordEntryPublishedImpl implements EntryAfterPublishEventHandler.Interface {
    constructor(private recorder: EntryActivityRecorder.Interface) {}

    async handle(event: EntryAfterPublishEventHandler.Event): Promise<void> {
        await this.recorder.record({
            model: event.payload.model,
            entry: event.payload.entry,
            action: "entry.publish",
            original: event.payload.original
        });
    }
}

export const RecordEntryPublished = EntryAfterPublishEventHandler.createImplementation({
    implementation: RecordEntryPublishedImpl,
    dependencies: [EntryActivityRecorder]
});
