/**
 * The `type` of the record-changed message sent when an entry changes. The message's `id` is the
 * `entryId` and its `scope` the model id. The admin's `ApplyEntryChangeToCache` filters on the same
 * string.
 *
 * Sent explicitly (today by the assistant's entry tools), not from the entry lifecycle events the
 * way team, role and user changes are announced. Entries are written in bulk (imports, bulk
 * actions, scheduled publishing), and a message per write would mean a websocket send per entry and
 * an admin read-back per message.
 */
export const ENTRY_RECORD_TYPE = "cms.entry";
