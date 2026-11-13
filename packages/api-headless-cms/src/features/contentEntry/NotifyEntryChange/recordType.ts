/**
 * The `type` of the record-changed message sent when an entry changes. Carries the model, because the
 * admin needs it to read the entry back and to find the list it belongs in; the message id is the
 * `entryId`. Same naming as the CMS webhooks (`cms.entry.<modelId>.created`). The admin's
 * `EntryRecordChanges` parses the same prefix.
 */
const ENTRY_RECORD_TYPE_PREFIX = "cms.entry.";

export const getEntryRecordType = (modelId: string): string => {
    return `${ENTRY_RECORD_TYPE_PREFIX}${modelId}`;
};
