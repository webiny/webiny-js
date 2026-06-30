import { Webiny } from "@webiny/sdk";
import type {
    CmsSdkConfig,
    CmsEntryValues,
    CmsEntry,
    CmsListResult,
    GetEntryParams,
    ListEntriesParams,
    IContentSdk
} from "./types.js";

const SYSTEM_FIELDS = ["id", "entryId", "createdOn", "modifiedOn", "savedOn"];

export class LiveSdk implements IContentSdk {
    private webiny: Webiny;
    private preview: boolean;

    constructor(config: CmsSdkConfig) {
        this.preview = config.preview === true;
        this.webiny = new Webiny({
            endpoint: config.apiHost,
            token: config.apiKey,
            tenant: config.apiTenant || "root",
            fetch: config.fetch
        });
    }

    async getEntry<T extends CmsEntryValues = CmsEntryValues>(
        params: GetEntryParams
    ): Promise<CmsEntry<T> | null> {
        const result = await this.webiny.cms.getEntry<T>({
            modelId: params.modelId,
            where: { entryId: params.entryId },
            fields: [...SYSTEM_FIELDS, "values.*"],
            preview: this.preview
        });

        if (result.isFail()) {
            return null;
        }

        return result.value as CmsEntry<T>;
    }

    async listEntries<T extends CmsEntryValues = CmsEntryValues>(
        params: ListEntriesParams
    ): Promise<CmsListResult<T>> {
        const result = await this.webiny.cms.listEntries<T>({
            modelId: params.modelId,
            where: params.where,
            sort: params.sort,
            limit: params.limit,
            after: params.after,
            fields: [...SYSTEM_FIELDS, "values.*"],
            preview: this.preview
        });

        if (result.isFail()) {
            return { data: [], meta: { cursor: null, hasMoreItems: false, totalCount: 0 } };
        }

        return result.value as CmsListResult<T>;
    }
}
