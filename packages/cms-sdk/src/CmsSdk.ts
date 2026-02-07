import type { CmsSdkConfig } from "./types.js";
import type { GetEntryParams, CmsEntry } from "./methods/getEntry.js";
import type { ListEntriesParams, ListEntriesResult } from "./methods/listEntries.js";
import type { CreateEntryParams } from "./methods/createEntry.js";
import type { UpdateEntryParams } from "./methods/updateEntry.js";
import type { DeleteEntryParams } from "./methods/deleteEntry.js";
import type { PublishEntryParams } from "./methods/publishEntry.js";
import type { UnpublishEntryParams } from "./methods/unpublishEntry.js";
import { getEntry as getEntryFn } from "./methods/getEntry.js";
import { listEntries as listEntriesFn } from "./methods/listEntries.js";
import { createEntry as createEntryFn } from "./methods/createEntry.js";
import { updateEntry as updateEntryFn } from "./methods/updateEntry.js";
import { deleteEntry as deleteEntryFn } from "./methods/deleteEntry.js";
import { publishEntry as publishEntryFn } from "./methods/publishEntry.js";
import { unpublishEntry as unpublishEntryFn } from "./methods/unpublishEntry.js";

export class CmsSdk {
    private config: CmsSdkConfig;
    private fetchFn: typeof fetch;

    constructor(config: CmsSdkConfig) {
        this.config = config;
        this.fetchFn = config.fetch || fetch;
    }

    async getEntry(params: GetEntryParams): Promise<CmsEntry | null> {
        return getEntryFn(this.config, this.fetchFn, params);
    }

    async listEntries(params: ListEntriesParams): Promise<ListEntriesResult> {
        return listEntriesFn(this.config, this.fetchFn, params);
    }

    async createEntry(params: CreateEntryParams): Promise<CmsEntry> {
        return createEntryFn(this.config, this.fetchFn, params);
    }

    async updateEntry(params: UpdateEntryParams): Promise<CmsEntry> {
        return updateEntryFn(this.config, this.fetchFn, params);
    }

    async deleteEntry(params: DeleteEntryParams): Promise<boolean> {
        return deleteEntryFn(this.config, this.fetchFn, params);
    }

    async publishEntry(params: PublishEntryParams): Promise<CmsEntry> {
        return publishEntryFn(this.config, this.fetchFn, params);
    }

    async unpublishEntry(params: UnpublishEntryParams): Promise<CmsEntry> {
        return unpublishEntryFn(this.config, this.fetchFn, params);
    }
}
