import { EntryAfterDeleteMultipleEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteMultipleEntries/index.js";
import { generateAlphaNumericLowerCaseId } from "@webiny/utils";
import { EntryActivityRecorder } from "~/cms/recorder/abstractions.js";

/**
 * One record per entry, all sharing a correlation id.
 *
 * A batch is not one activity: each entry gets its own timeline row, because each entry's timeline
 * is read on its own. The correlation id is what lets a reader see that thirty deletions were one
 * action rather than thirty.
 *
 * Records are appended one at a time rather than in parallel. `append` is a storage write inside a
 * write that is already committed, and firing a batch of them concurrently would turn a large bulk
 * action into a burst against a single partition. Sequential is slower and kinder, and the
 * recorder swallows failures individually so one bad record cannot take the rest down.
 */
class RecordEntriesDeletedInBulkImpl implements EntryAfterDeleteMultipleEventHandler.Interface {
    constructor(private recorder: EntryActivityRecorder.Interface) {}

    async handle(event: EntryAfterDeleteMultipleEventHandler.Event): Promise<void> {
        const { model, entries } = event.payload;
        const correlationId = generateAlphaNumericLowerCaseId(12);

        for (const entry of entries) {
            await this.recorder.record({
                model,
                entry,
                action: "entry.delete",
                correlationId
            });
        }
    }
}

export const RecordEntriesDeletedInBulk = EntryAfterDeleteMultipleEventHandler.createImplementation(
    {
        implementation: RecordEntriesDeletedInBulkImpl,
        dependencies: [EntryActivityRecorder]
    }
);
