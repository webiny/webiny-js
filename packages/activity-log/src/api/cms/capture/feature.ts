import { type Container, createFeature } from "@webiny/feature/api";
import { RecordEntriesDeletedInBulk } from "./RecordEntriesDeletedInBulk.js";
import { RecordEntryCreated } from "./RecordEntryCreated.js";
import { RecordEntryDeleted } from "./RecordEntryDeleted.js";
import { RecordEntryMoved } from "./RecordEntryMoved.js";
import { RecordEntryPublished } from "./RecordEntryPublished.js";
import { RecordEntryRepublished } from "./RecordEntryRepublished.js";
import { RecordEntryRestored } from "./RecordEntryRestored.js";
import { RecordEntryRevisionCreated } from "./RecordEntryRevisionCreated.js";
import { RecordEntryRevisionDeleted } from "./RecordEntryRevisionDeleted.js";
import { RecordEntryRevisionDescribed } from "./RecordEntryRevisionDescribed.js";
import { RecordEntryUnpublished } from "./RecordEntryUnpublished.js";
import { RecordEntryUpdated } from "./RecordEntryUpdated.js";

/**
 * One thin handler per captured event. The set is asserted against the CMS source by the coverage
 * guards, so a new after-event upstream fails a test rather than silently going unrecorded.
 */
export const CaptureFeature = createFeature({
    name: "ActivityLog/Capture",
    register(container: Container) {
        container.register(RecordEntryCreated);
        container.register(RecordEntryUpdated);
        container.register(RecordEntryRevisionCreated);
        container.register(RecordEntryRevisionDeleted);
        container.register(RecordEntryPublished);
        container.register(RecordEntryUnpublished);
        container.register(RecordEntryRepublished);
        container.register(RecordEntryMoved);
        container.register(RecordEntryDeleted);
        container.register(RecordEntryRestored);
        container.register(RecordEntriesDeletedInBulk);
        container.register(RecordEntryRevisionDescribed);
    }
});
