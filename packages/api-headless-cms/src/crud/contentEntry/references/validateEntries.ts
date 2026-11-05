import type { CmsContext } from "~/types/index.js";
import dotPropImmutable from "dot-prop-immutable";
import { WebinyError } from "@webiny/error";

interface ReferenceObject {
    id: string;
    modelId: string;
}

interface ValidateReferencedEntriesParams {
    output: Record<string, any>;
    context: Pick<CmsContext, "cms" | "security">;
    referenceFieldPaths: string[];
}

const getReferenceFieldValue = (
    ref: Partial<ReferenceObject> | null | undefined
): ReferenceObject | null => {
    if (!ref?.id || !ref.modelId) {
        return null;
    }
    return ref as ReferenceObject;
};

export const validateReferencedEntries = async ({
    output,
    context,
    referenceFieldPaths
}: ValidateReferencedEntriesParams) => {
    const referencesByModel = new Map<string, string[]>();

    /**
     * Group references by modelId.
     */
    for (const path of referenceFieldPaths) {
        const ref = dotPropImmutable.get(output, path) as ReferenceObject | any;

        const result = getReferenceFieldValue(ref);

        if (!result) {
            continue;
        }

        const refs = referencesByModel.get(result.modelId) || [];
        refs.push(result.id);
        referencesByModel.set(result.modelId, refs);
    }

    if (referencesByModel.size === 0) {
        return;
    }

    /**
     * Load all models and use only those that are used in reference.
     */
    const allModels = await context.security.withoutAuthorization(async () => {
        // Private models are included, so references to them can be refused below.
        return context.cms.listModels({ includePrivate: true });
    });

    /**
     * Private models are internal, so a reference to their entries fails as a missing entry.
     */
    for (const model of allModels) {
        if (!model.isPrivate) {
            continue;
        }
        const [id] = referencesByModel.get(model.modelId) || [];
        if (id) {
            throw new WebinyError(
                `Missing referenced entry with id "${id}" in model "${model.modelId}".`,
                "ENTRY_NOT_FOUND",
                {
                    id,
                    model: model.modelId
                }
            );
        }
    }

    const models = allModels.filter(model => {
        const entries = referencesByModel.get(model.modelId) || [];
        return entries.length > 0;
    });

    if (!models.length) {
        return;
    }

    /**
     * Load all the entries by their IDs.
     */
    const promises = await context.security.withoutAuthorization(async () => {
        return models.map(model => {
            return context.cms.getEntriesByIds(model, referencesByModel.get(model.modelId) || []);
        });
    });

    const allEntries = await Promise.all(promises).then(res => res.flat());
    const entriesByModel = allEntries.reduce<Record<string, string[]>>((acc, entry) => {
        return { ...acc, [entry.modelId]: [...(acc[entry.modelId] || []), entry.id] };
    }, {});

    /**
     * Verify that all entries exist.
     */
    referencesByModel.forEach((ids, modelId) => {
        const modelEntriesInDb = entriesByModel[modelId];
        for (const id of ids) {
            if (!modelEntriesInDb || !modelEntriesInDb.includes(id)) {
                throw new WebinyError(
                    `Missing referenced entry with id "${id}" in model "${modelId}".`,
                    "ENTRY_NOT_FOUND",
                    {
                        id,
                        model: modelId
                    }
                );
            }
        }
    });
};
