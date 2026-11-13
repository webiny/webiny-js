import { RecordChangedEventHandler } from "@webiny/app/features/recordChanges/index.js";
import { EventPublisher } from "@webiny/app/features/eventPublisher/index.js";
import { ServerEntryChangedEvent } from "./ServerEntryChangedEvent.js";
import { ServerEntryDeletedEvent } from "./ServerEntryDeletedEvent.js";

// Sent by the api for entries, as `cms.entry.<modelId>`; see `getEntryRecordType` in
// @webiny/api-headless-cms.
const ENTRY_RECORD_TYPE_PREFIX = "cms.entry.";

/** Turns the api's entry record changes into entry events. */
class EntryRecordChangesImpl implements RecordChangedEventHandler.Interface {
    constructor(private eventPublisher: EventPublisher.Interface) {}

    async handle(event: RecordChangedEventHandler.Event): Promise<void> {
        const { type, id, change } = event.payload;
        if (!type.startsWith(ENTRY_RECORD_TYPE_PREFIX)) {
            return;
        }

        const payload = { modelId: type.slice(ENTRY_RECORD_TYPE_PREFIX.length), entryId: id };
        await this.eventPublisher.publish(
            change === "deleted"
                ? new ServerEntryDeletedEvent(payload)
                : new ServerEntryChangedEvent(payload)
        );
    }
}

export const EntryRecordChanges = RecordChangedEventHandler.createImplementation({
    implementation: EntryRecordChangesImpl,
    dependencies: [EventPublisher]
});
