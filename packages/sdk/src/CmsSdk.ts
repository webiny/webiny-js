import type { WebinyConfig } from "./types.js";
import type { CmsEntryValues, CmsEntryData } from "./methods/cms/cmsTypes.js";
import type { GetEntryParams } from "./methods/cms/getEntry.js";
import type { ListEntriesParams, ListEntriesResult } from "./methods/cms/listEntries.js";
import type { CreateEntryParams, CreateCmsEntryData } from "./methods/cms/createEntry.js";
import type {
    UpdateEntryRevisionParams,
    UpdateCmsEntryData
} from "./methods/cms/updateEntryRevision.js";
import type { DeleteEntryRevisionParams } from "./methods/cms/deleteEntryRevision.js";
import type { PublishEntryRevisionParams } from "./methods/cms/publishEntryRevision.js";
import type { UnpublishEntryRevisionParams } from "./methods/cms/unpublishEntryRevision.js";
import type { HttpError, GraphQLError, NetworkError } from "./errors.js";
import type { Result } from "./Result.js";
import { getEntry as getEntryFn } from "./methods/cms/getEntry.js";
import { listEntries as listEntriesFn } from "./methods/cms/listEntries.js";
import { createEntry as createEntryFn } from "./methods/cms/createEntry.js";
import { updateEntryRevision as updateEntryRevisionFn } from "./methods/cms/updateEntryRevision.js";
import { deleteEntryRevision as deleteEntryRevisionFn } from "./methods/cms/deleteEntryRevision.js";
import { publishEntryRevision as publishEntryRevisionFn } from "./methods/cms/publishEntryRevision.js";
import { unpublishEntryRevision as unpublishEntryRevisionFn } from "./methods/cms/unpublishEntryRevision.js";

export class CmsSdk {
    private config: WebinyConfig;
    private fetchFn: typeof fetch;

    constructor(config: WebinyConfig) {
        this.config = config;
        this.fetchFn = config.fetch || fetch;
    }

    async getEntry<TValues extends CmsEntryValues = CmsEntryValues>(
        params: GetEntryParams
    ): Promise<Result<CmsEntryData<TValues> | null, HttpError | GraphQLError | NetworkError>> {
        return getEntryFn<TValues>(this.config, this.fetchFn, params);
    }

    async listEntries<TValues extends CmsEntryValues = CmsEntryValues>(
        params: ListEntriesParams
    ): Promise<Result<ListEntriesResult<TValues>, HttpError | GraphQLError | NetworkError>> {
        return listEntriesFn<TValues>(this.config, this.fetchFn, params);
    }

    async createEntry<TValues extends CmsEntryValues = CmsEntryValues>(
        params: CreateEntryParams<TValues>
    ): Promise<Result<CreateCmsEntryData<TValues>, HttpError | GraphQLError | NetworkError>> {
        return createEntryFn<TValues>(this.config, this.fetchFn, params);
    }

    async updateEntryRevision<TValues extends CmsEntryValues = CmsEntryValues>(
        params: UpdateEntryRevisionParams<TValues>
    ): Promise<Result<UpdateCmsEntryData<TValues>, HttpError | GraphQLError | NetworkError>> {
        return updateEntryRevisionFn<TValues>(this.config, this.fetchFn, params);
    }

    async deleteEntryRevision(
        params: DeleteEntryRevisionParams
    ): Promise<Result<boolean, HttpError | GraphQLError | NetworkError>> {
        return deleteEntryRevisionFn(this.config, this.fetchFn, params);
    }

    async publishEntryRevision<TValues extends CmsEntryValues = CmsEntryValues>(
        params: PublishEntryRevisionParams
    ): Promise<Result<CmsEntryData<TValues>, HttpError | GraphQLError | NetworkError>> {
        return publishEntryRevisionFn<TValues>(this.config, this.fetchFn, params);
    }

    async unpublishEntryRevision<TValues extends CmsEntryValues = CmsEntryValues>(
        params: UnpublishEntryRevisionParams
    ): Promise<Result<CmsEntryData<TValues>, HttpError | GraphQLError | NetworkError>> {
        return unpublishEntryRevisionFn<TValues>(this.config, this.fetchFn, params);
    }
}
