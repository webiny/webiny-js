import type { CmsEntry, CmsEntryValues, CmsModelMetadata, GetEntryParams } from "./types.js";
import { collectRefs, setAtPath } from "./refUtils.js";

export interface EntryFetcher {
    getEntry(params: GetEntryParams): Promise<CmsEntry | null>;
}

export async function resolveRefs<T extends CmsEntryValues = CmsEntryValues>(
    entry: CmsEntry<T>,
    metadata: CmsModelMetadata | undefined,
    sdk: EntryFetcher
): Promise<CmsEntry<T>> {
    const refModels = metadata?.refModels;
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
        const resolved = await sdk.getEntry({ modelId: ref.modelId, entryId: ref.id });
        return { id: ref.id, resolved };
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
