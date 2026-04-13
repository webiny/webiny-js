import { immutableGet, immutableSet } from "@webiny/utils/dotProp/index.js";
import { parseIdentifier } from "@webiny/utils";
import type { CmsContext, CmsEntryValues, CmsModel } from "~/types/index.js";
import { buildReferenceFieldPaths } from "./references/buildPaths.js";
import { validateReferencedEntries } from "~/crud/contentEntry/references/validateEntries.js";
import { createIdentifier } from "@webiny/utils/createIdentifier.js";

interface CmsRefEntry {
    id: string;
    entryId: string;
    modelId: string;
}

interface IReferenceFieldsMappingParams<TValues extends CmsEntryValues = CmsEntryValues> {
    context: CmsContext;
    model: CmsModel;
    values: TValues;
    validateEntries?: boolean;
}

/**
 * This function traverses the content entry input value, extracts all occurrences of the `ref` field,
 * optionally verifies that those referenced entries exist (by loading them), and normalizes the `ref` value to
 * always contain `{ id, modelId, entryId }`. `entryId` is important when data is being loaded via
 * the `read` and `preview` endpoint.
 */
export const referenceFieldsMapping = async <TValues extends CmsEntryValues = CmsEntryValues>(
    params: IReferenceFieldsMappingParams<TValues>
): Promise<TValues> => {
    const { context, model, values, validateEntries = false } = params;

    let output = structuredClone(values);

    const referenceFieldPaths = buildReferenceFieldPaths<TValues>({
        fields: model.fields,
        input: values,
        parentPaths: []
    });

    if (!referenceFieldPaths.length) {
        return output;
    }

    if (validateEntries) {
        await validateReferencedEntries({
            output,
            context,
            referenceFieldPaths
        });
    }

    /**
     * Assign the entryId, id and model values to the output.
     */
    for (const path of referenceFieldPaths) {
        // It is safe to cast here, because `referenceFieldPaths` array is generated from the `input`.
        const refValue = immutableGet<CmsRefEntry | undefined>(values, path);
        if (!refValue) {
            continue;
        }

        /**
         * Over time, the structure of `RefInput` was changing, and we need to handle different cases for backwards
         * compatibility. The latest valid structure of a `ref` field value is { id, modelId }, but we also need
         * to make sure that the legacy structure { entryId, modelId } is supported.
         */
        const { id: entryId, version } = parseIdentifier(refValue.id || refValue.entryId);

        const id = createIdentifier({
            version: version || 1,
            id: entryId
        });

        output = immutableSet(output, path, {
            id,
            entryId,
            modelId: refValue.modelId
        });
    }

    return output;
};
