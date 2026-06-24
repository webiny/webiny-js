import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import type { CmsContext } from "~/types/index.js";
import dotPropImmutable from "dot-prop-immutable";
import { WebinyError } from "@webiny/error";
import { ListModelsUseCase } from "~/features/contentModel/ListModels/index.js";
import { GetEntriesByIdsUseCase } from "~/features/contentEntry/GetEntriesByIds/index.js";

interface ReferenceObject {
    id: string;
    modelId: string;
}

interface ValidateReferencedEntriesParams {
    output: Record<string, any>;
    context: Pick<CmsContext, "container">;
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
    const modelsResult = await context.container
        .resolve(IdentityContext)
        .withoutAuthorization(async () => {
            return context.container.resolve(ListModelsUseCase).execute();
        });
    if (modelsResult.isFail()) {
        throw modelsResult.error;
    }
    const models = modelsResult.value.filter(model => {
        const entries = referencesByModel.get(model.modelId) || [];
        return entries.length > 0;
    });

    if (!models.length) {
        return;
    }

    /**
     * Load all the entries by their IDs.
     */
    const allEntries = await context.container
        .resolve(IdentityContext)
        .withoutAuthorization(async () => {
            const fetches = models.map(async model => {
                const result = await context.container
                    .resolve(GetEntriesByIdsUseCase)
                    .execute(model, referencesByModel.get(model.modelId) || []);
                if (result.isFail()) {
                    throw result.error;
                }
                return result.value;
            });
            return (await Promise.all(fetches)).flat();
        });
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
