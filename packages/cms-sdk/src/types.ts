export interface CmsSdkConfig {
    apiToken: string;
    apiHost: string;
    apiTenant: string;
    fetch?: typeof fetch;
}

// Re-export types from method files for convenience
export type { GetEntryParams, CmsEntry } from "./methods/getEntry.js";
export type { ListEntriesParams, ListEntriesResult } from "./methods/listEntries.js";
export type { CreateEntryParams } from "./methods/createEntry.js";
export type { UpdateEntryParams } from "./methods/updateEntry.js";
export type { DeleteEntryParams } from "./methods/deleteEntry.js";
export type { PublishEntryParams } from "./methods/publishEntry.js";
export type { UnpublishEntryParams } from "./methods/unpublishEntry.js";
