import { Webiny } from "@webiny/sdk";
import type {
    CmsSdkConfig,
    CmsEntryValues,
    CmsEntry,
    CmsListResult,
    CmsModelDefinition,
    GetEntryParams,
    ListEntriesParams,
    IContentSdk
} from "./types.js";
import { collectRefs, setAtPath } from "./refUtils.js";

const SYSTEM_FIELDS = ["id", "entryId", "createdOn", "modifiedOn", "savedOn"];

export class LiveSdk implements IContentSdk {
    private webiny: Webiny;
    private preview: boolean;
    private modelCache = new Map<string, CmsModelDefinition>();

    constructor(config: CmsSdkConfig) {
        this.preview = config.preview === true;
        this.webiny = new Webiny({
            endpoint: config.apiHost,
            token: config.apiKey,
            tenant: config.apiTenant || "root",
            fetch: config.fetch
        });
    }

    async getModel(modelId: string): Promise<CmsModelDefinition | null> {
        const cached = this.modelCache.get(modelId);
        if (cached) {
            return cached;
        }

        const result = await this.webiny.cms.getModel({ modelId });
        if (result.isFail()) {
            return null;
        }

        const model = result.value as CmsModelDefinition;
        this.modelCache.set(modelId, model);
        return model;
    }

    async getEntry<T extends CmsEntryValues = CmsEntryValues>(
        params: GetEntryParams
    ): Promise<CmsEntry<T> | null> {
        const where = params.entryId.includes("#")
            ? { id: params.entryId }
            : { entryId: params.entryId };

        const result = await this.webiny.cms.getEntry<T>({
            modelId: params.modelId,
            where,
            fields: [...SYSTEM_FIELDS, "values.*"],
            preview: this.preview
        });

        if (result.isFail()) {
            return null;
        }

        const entry = result.value as CmsEntry<T>;

        return this.resolveEntryRefs(entry, params.modelId);
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

    private async resolveEntryRefs<T extends CmsEntryValues>(
        entry: CmsEntry<T>,
        modelId: string
    ): Promise<CmsEntry<T>> {
        const model = this.modelCache.get(modelId);
        if (!model) {
            return entry;
        }

        const refModels = model.metadata?.refModels;
        if (!refModels || Object.keys(refModels).length === 0) {
            return entry;
        }

        const refs = collectRefs(entry.values, refModels);
        if (refs.length === 0) {
            return entry;
        }

        const uniqueRefs = new Map<string, { id: string; modelId: string }>();
        for (const ref of refs) {
            uniqueRefs.set(ref.id, ref);
        }

        const fetchPromises = Array.from(uniqueRefs.values()).map(async ref => {
            const resolved = await this.getEntry({ modelId: ref.modelId, entryId: ref.id });
            return { id: ref.id, modelId: ref.modelId, resolved };
        });

        const results = await Promise.all(fetchPromises);
        const resolvedMap = new Map<string, CmsEntry | null>();
        for (const { id, resolved } of results) {
            resolvedMap.set(id, resolved);
        }

        const resolvedValues = JSON.parse(JSON.stringify(entry.values)) as Record<string, unknown>;

        for (const ref of refs) {
            const resolved = resolvedMap.get(ref.id);
            if (resolved) {
                setAtPath(resolvedValues, ref.path, { ...resolved, modelId: ref.modelId });
            }
        }

        return { ...entry, values: resolvedValues as T };
    }
}
