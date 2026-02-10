import type { CmsSdkConfig } from "./types.js";
import type { GetEntryParams } from "./methods/getEntry.js";
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

    async getEntry<TValues = Record<string, unknown>>(
        params: GetEntryParams
    ): Promise<TValues | null> {
        return getEntryFn<TValues>(this.config, this.fetchFn, params);
    }

    async listEntries<TValues = Record<string, unknown>>(
        params: ListEntriesParams
    ): Promise<ListEntriesResult<TValues>> {
        return listEntriesFn<TValues>(this.config, this.fetchFn, params);
    }

    async createEntry<TValues = Record<string, unknown>>(
        params: CreateEntryParams<TValues>
    ): Promise<TValues> {
        return createEntryFn<TValues>(this.config, this.fetchFn, params);
    }

    async updateEntry<TValues = Record<string, unknown>>(
        params: UpdateEntryParams<TValues>
    ): Promise<TValues> {
        return updateEntryFn<TValues>(this.config, this.fetchFn, params);
    }

    async deleteEntry(params: DeleteEntryParams): Promise<boolean> {
        return deleteEntryFn(this.config, this.fetchFn, params);
    }

    async publishEntry<TValues = Record<string, unknown>>(params: PublishEntryParams): Promise<TValues> {
        return publishEntryFn<TValues>(this.config, this.fetchFn, params);
    }

    async unpublishEntry<TValues = Record<string, unknown>>(params: UnpublishEntryParams): Promise<TValues> {
        return unpublishEntryFn<TValues>(this.config, this.fetchFn, params);
    }
}
