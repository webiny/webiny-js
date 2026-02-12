import type { CmsSdkConfig } from "./types.js";
import type { GetEntryParams } from "./methods/getEntry.js";
import type { GetEntryRevisionByIdParams } from "./methods/getEntryRevisionById.js";
import type { ListEntriesParams, ListEntriesResult } from "./methods/listEntries.js";
import type { CreateEntryParams } from "./methods/createEntry.js";
import type { UpdateEntryRevisionParams } from "./methods/updateEntryRevision.js";
import type { DeleteEntryRevisionParams } from "./methods/deleteEntryRevision.js";
import type { PublishEntryRevisionParams } from "./methods/publishEntryRevision.js";
import type { UnpublishEntryRevisionParams } from "./methods/unpublishEntryRevision.js";
import { getEntry as getEntryFn } from "./methods/getEntry.js";
import { getEntryRevisionById as getEntryRevisionByIdFn } from "./methods/getEntryRevisionById.js";
import { listEntries as listEntriesFn } from "./methods/listEntries.js";
import { createEntry as createEntryFn } from "./methods/createEntry.js";
import { updateEntryRevision as updateEntryRevisionFn } from "./methods/updateEntryRevision.js";
import { deleteEntryRevision as deleteEntryRevisionFn } from "./methods/deleteEntryRevision.js";
import { publishEntryRevision as publishEntryRevisionFn } from "./methods/publishEntryRevision.js";
import { unpublishEntryRevision as unpublishEntryRevisionFn } from "./methods/unpublishEntryRevision.js";

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

    async getEntryRevisionById<TValues = Record<string, unknown>>(
        params: GetEntryRevisionByIdParams
    ): Promise<TValues | null> {
        return getEntryRevisionByIdFn<TValues>(this.config, this.fetchFn, params);
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

    async updateEntryRevision<TValues = Record<string, unknown>>(
        params: UpdateEntryRevisionParams<TValues>
    ): Promise<TValues> {
        return updateEntryRevisionFn<TValues>(this.config, this.fetchFn, params);
    }

    async deleteEntryRevision(params: DeleteEntryRevisionParams): Promise<boolean> {
        return deleteEntryRevisionFn(this.config, this.fetchFn, params);
    }

    async publishEntryRevision<TValues = Record<string, unknown>>(params: PublishEntryRevisionParams): Promise<TValues> {
        return publishEntryRevisionFn<TValues>(this.config, this.fetchFn, params);
    }

    async unpublishEntryRevision<TValues = Record<string, unknown>>(params: UnpublishEntryRevisionParams): Promise<TValues> {
        return unpublishEntryRevisionFn<TValues>(this.config, this.fetchFn, params);
    }
}
