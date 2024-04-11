import dotProp from "dot-prop";
import WebinyError from "@webiny/error";
import { parseIdentifier } from "@webiny/utils";
import { getBaseFieldType } from "~/utils/getBaseFieldType";
import { CmsContext, CmsDynamicZoneTemplate, CmsModel, CmsModelField } from "~/types";

interface CmsRefEntry {
    id: string;
    entryId: string;
    modelId: string;
}

type RefValue = Pick<CmsRefEntry, "id" | "modelId"> & {
    entryId?: string;
};

interface ReferenceObject {
    id: string;
    modelId: string;
}

interface Params {
    context: CmsContext;
    model: CmsModel;
    input: Record<string, ReferenceObject | ReferenceObject[]>;
    validateEntries?: boolean;
}

interface BuildReferenceFieldPaths {
    fields: CmsModelField[];
    parentPaths: string[];
    input: Record<string, any>;
}

const buildReferenceFieldPaths = (params: BuildReferenceFieldPaths): string[] => {
    const { fields, parentPaths: initialParentPaths, input } = params;

    const parentPaths = [...initialParentPaths];

    const isMultipleValues = Array.isArray(input);

    return fields
        .filter(field => ["object", "ref", "dynamicZone"].includes(getBaseFieldType(field)))
        .reduce((collection, field) => {
            /**
             * First we check the ref field
             */
            const baseType = getBaseFieldType(field);
            if (baseType === "ref") {
                const parentPathsValue = parentPaths.length > 0 ? `${parentPaths.join(".")}.` : "";
                if (field.multipleValues) {
                    const inputValue = dotProp.get(input, `${field.fieldId}`, []);
                    if (!Array.isArray(inputValue)) {
                        return collection;
                    }

                    for (const key in inputValue) {
                        const path = `${parentPathsValue}${field.fieldId}.${key}`;
                        collection.push(path);
                    }
                    return collection;
                }

                if (isMultipleValues) {
                    for (const key in input) {
                        const path = `${parentPathsValue}${key}.${field.fieldId}`;
                        collection.push(path);
                    }
                    return collection;
                }

                collection.push(`${parentPathsValue}${field.fieldId}`);

                return collection;
            }

            if (baseType === "dynamicZone") {
                const templates: CmsDynamicZoneTemplate[] = field.settings?.templates || [];

                if (field.multipleValues) {
                    const values = dotProp.get(input, field.fieldId, []);
                    if (!Array.isArray(values)) {
                        return collection;
                    }

                    values.forEach((value, index) => {
                        const valueTemplate = Object.keys(value)[0];
                        const template = templates.find(tpl => tpl.gqlTypeName === valueTemplate);
                        if (!template) {
                            return;
                        }

                        const result = buildReferenceFieldPaths({
                            fields: template.fields,
                            input: value[valueTemplate],
                            parentPaths: parentPaths.concat([
                                field.fieldId,
                                String(index),
                                template.gqlTypeName
                            ])
                        });

                        collection.push(...result);
                    });

                    return collection;
                }

                const value = dotProp.get(input, field.fieldId, {});
                if (!value) {
                    return collection;
                }

                const valueTemplate = Object.keys(value)[0];
                const template = templates.find(tpl => tpl.gqlTypeName === valueTemplate);

                if (!template) {
                    return collection;
                }

                const result = buildReferenceFieldPaths({
                    fields: template.fields,
                    input: dotProp.get(value, valueTemplate, {}),
                    parentPaths: parentPaths.concat([field.fieldId, template.gqlTypeName])
                });
                collection.push(...result);

                return collection;
            }

            /**
             * Then we move onto the object field
             */
            const parentPathsValue = parentPaths.length > 0 ? `${parentPaths.join(".")}.` : "";
            /**
             * This is if received input is array. We need to map key with fieldId at this point.
             */
            if (isMultipleValues) {
                for (const key in input) {
                    const path = `${parentPathsValue}${key}.${field.fieldId}`;
                    collection.push(path);
                }
                return collection;
            }

            const objFieldPath = `${field.fieldId}`;
            const objFieldInputValue = dotProp.get(input, objFieldPath, []);

            /**
             * If field is multiple values one, we need to go through the input and use the existing keys.
             */
            if (field.multipleValues) {
                if (Array.isArray(objFieldInputValue) === false) {
                    return collection;
                }
                for (const key in objFieldInputValue) {
                    const result = buildReferenceFieldPaths({
                        fields: field.settings?.fields || [],
                        input: objFieldInputValue[key],
                        parentPaths: parentPaths.concat([field.fieldId, key])
                    });
                    collection.push(...result);
                }

                return collection;
            }

            /**
             * Single value reference field.
             */
            const results = buildReferenceFieldPaths({
                fields: field.settings?.fields || [],
                input: objFieldInputValue,
                parentPaths: parentPaths.concat([field.fieldId])
            });

            return collection.concat(results);
        }, [] as string[]);
};

const getReferenceFieldValue = (ref: any): { id: string | null; modelId: string | null } => {
    if (!ref) {
        return {
            id: null,
            modelId: null
        };
    }
    return {
        id: (ref.id || ref.entryId || "").trim() || null,
        modelId: (ref.modelId || "").trim() || null
    };
};

/**
 * This function traverses the content entry input value, extracts all occurrences of the `ref` field,
 * optionally verifies that those referenced entries exist (by loading them), and normalizes the `ref` value to
 * always contain `{ id, modelId, entryId }`. `entryId` is important when data is being loaded via
 * the `read` and `preview` endpoint.
 */
export const referenceFieldsMapping = async (params: Params): Promise<Record<string, any>> => {
    const { context, model, input, validateEntries = false } = params;

    let output: Record<string, any> = {
        ...input
    };

    const referenceFieldPaths = buildReferenceFieldPaths({
        fields: model.fields,
        input,
        parentPaths: []
    });

    if (!referenceFieldPaths.length) {
        return output;
    }

    if (validateEntries) {
        await validateReferencedEntries({ output, context, referenceFieldPaths });
    }

    /**
     * Assign the entryId, id and model values to the output.
     */
    for (const path of referenceFieldPaths) {
        // It is safe to cast here, because `referenceFieldPaths` array is generated from the `input`.
        const refValue: RefValue | undefined = dotProp.get(input, path);
        if (!refValue) {
            continue;
        }

        /**
         * Over time, the structure of `RefInput` was changing, and we need to handle different cases for backwards
         * compatibility. The latest valid structure of a `ref` field value is { id, modelId }, but we also need
         * to make sure that the legacy structure { entryId, modelId } is supported.
         */
        const { id, modelId, entryId: maybeEntryId } = refValue;

        const { id: entryId } = parseIdentifier(maybeEntryId || id);

        output = dotProp.set(output, path, {
            // If `id` is not set, we're dealing with the legacy structure.
            id: id ?? maybeEntryId,
            entryId,
            modelId
        });
    }

    return output;
};

interface ValidateReferencedEntriesParams {
    output: Record<string, any>;
    context: CmsContext;
    referenceFieldPaths: string[];
}

async function validateReferencedEntries({
    output,
    context,
    referenceFieldPaths
}: ValidateReferencedEntriesParams) {
    const referencesByModel = new Map<string, string[]>();

    /**
     * Group references by modelId.
     */
    for (const path of referenceFieldPaths) {
        const ref = dotProp.get(output, path) as ReferenceObject | any;

        const { id, modelId } = getReferenceFieldValue(ref);

        if (!id || !modelId) {
            continue;
        }

        if (!referencesByModel.has(modelId)) {
            referencesByModel.set(modelId, []);
        }

        referencesByModel.get(modelId)?.push(id);
    }

    if (!referencesByModel.size) {
        return;
    }

    /**
     * Load all models and use only those that are used in reference.
     */
    const models = await context.security.withoutAuthorization(async () => {
        return (await context.cms.listModels()).filter(model => {
            const entries = referencesByModel.get(model.modelId);
            if (!Array.isArray(entries) || entries.length === 0) {
                return false;
            }
            return true;
        });
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
            if (!modelEntriesInDb.includes(id)) {
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
}
