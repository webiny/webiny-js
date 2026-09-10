import { EntryAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { EntryActivityRecorder } from "~/cms/recorder/abstractions.js";

/**
 * Trashing and permanent deletion are the same event.
 *
 * There is no `MoveToBin` event on this branch: `MoveEntryToBinUseCase` publishes
 * `EntryBeforeDeleteEvent` / `EntryAfterDeleteEvent` with `permanent: false`, and the permanent
 * path publishes the same pair with `permanent: true`. So the thirteen actions the design names
 * map onto twelve event modules, and this handler is where the two are told apart.
 *
 * The asymmetry is worth noting: restoring from the bin *does* have its own event, so trash and
 * restore are not a matched pair in the event set even though they are in the product.
 *
 * A permanent deletion is also what triggers cleanup of the target's records, which is handled
 * separately so that recording and cleanup fail independently.
 */
class RecordEntryDeletedImpl implements EntryAfterDeleteEventHandler.Interface {
    constructor(private recorder: EntryActivityRecorder.Interface) {}

    async handle(event: EntryAfterDeleteEventHandler.Event): Promise<void> {
        const { model, entry, permanent } = event.payload;

        await this.recorder.record({
            model,
            entry,
            action: permanent ? "entry.delete" : "entry.trash"
        });
    }
}

export const RecordEntryDeleted = EntryAfterDeleteEventHandler.createImplementation({
    implementation: RecordEntryDeletedImpl,
    dependencies: [EntryActivityRecorder]
});
