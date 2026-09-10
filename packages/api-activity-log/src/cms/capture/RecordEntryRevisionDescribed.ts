import { EntryAfterUpdateRevisionDescriptionEventHandler } from "@webiny/api-headless-cms/features/contentEntry/UpdateRevisionDescription/index.js";
import { EntryActivityRecorder } from "~/cms/recorder/abstractions.js";

/**
 * A revision description is metadata rather than content, so the changeset comes out empty. The original is still passed, because this event routes through the same UpdateEntryRepository as an ordinary save and a future change there should surface rather than be silently dropped.
 */
class RecordEntryRevisionDescribedImpl
    implements EntryAfterUpdateRevisionDescriptionEventHandler.Interface
{
    constructor(private recorder: EntryActivityRecorder.Interface) {}

    async handle(event: EntryAfterUpdateRevisionDescriptionEventHandler.Event): Promise<void> {
        await this.recorder.record({
            model: event.payload.model,
            entry: event.payload.entry,
            action: "entry.revision.describe",
            original: event.payload.original
        });
    }
}

export const RecordEntryRevisionDescribed =
    EntryAfterUpdateRevisionDescriptionEventHandler.createImplementation({
        implementation: RecordEntryRevisionDescribedImpl,
        dependencies: [EntryActivityRecorder]
    });
