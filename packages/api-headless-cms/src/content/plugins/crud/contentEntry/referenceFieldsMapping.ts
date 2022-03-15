import { CmsContext, CmsModel, CmsModelField } from "~/types";
import WebinyError from "@webiny/error";
import dotProp from "dot-prop";
import { parseIdentifier } from "@webiny/utils";

interface CmsRefEntry {
    id: string;
    entryId: string;
    modelId: string;
}

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
        .filter(field => ["object", "ref"].includes(field.type))
        .reduce((collection, field) => {
            /**
             * First we check the ref field
             */
            if (field.type === "ref") {
                const parentPathsValue = parentPaths.length > 0 ? `${parentPaths.join(".")}.` : "";
                if (field.multipleValues) {
                    const inputValue = dotProp.get(input, `${field.fieldId}`, []);
                    if (Array.isArray(inputValue) === false) {
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
    if (referenceFieldPaths.length === 0) {
        return output;
    }

    const referencesByModel: Record<string, string[]> = {};
    const pathsByReferenceId: Record<string, string[]> = {};

    for (const path of referenceFieldPaths) {
        const ref = dotProp.get(output, path) as ReferenceObject | any;

        const { id, modelId } = getReferenceFieldValue(ref);

        if (!id || !modelId) {
            continue;
        }
        if (!referencesByModel[modelId]) {
            referencesByModel[modelId] = [];
        }
        referencesByModel[modelId].push(id);
        if (!pathsByReferenceId[id]) {
            pathsByReferenceId[id] = [];
        }
        pathsByReferenceId[id].push(path);
    }

    /**
     * Again, no point in going further.
     */
    if (Object.keys(referencesByModel).length === 0) {
        return output;
    }
    /**
     * Load all models and use only those that are used in reference.
     */
    const models = (await context.cms.listModels()).filter(model => {
        const entries = referencesByModel[model.modelId];
        if (Array.isArray(entries) === false || entries.length === 0) {
            return false;
        }
        return true;
    });
    /**
     * Check for any model existence, just in case.
     */
    if (models.length === 0) {
        return output;
    }

    /**
     * Load all the entries by their ID
     */
    const promises = models.map(model => {
        return context.cms.getEntriesByIds(model, referencesByModel[model.modelId]);
    });

    const results = await Promise.all(promises);

    const records: Record<string, CmsRefEntry> = results.reduce((collection, entries) => {
        for (const entry of entries) {
            collection[entry.id] = {
                id: entry.id,
                entryId: entry.entryId,
                modelId: entry.modelId
            };
        }
        return collection;
    }, {} as Record<string, CmsRefEntry>);
    /**
     * Verify that all referenced entries actually exist.
     */
    for (const modelId in referencesByModel) {
        const entries = referencesByModel[modelId];
        for (const id of entries) {
            if (records[id]) {
                continue;
            } else if (validateEntries === true) {
                throw new WebinyError(
                    `Missing referenced entry with id "${id}" in model "${modelId}".`,
                    "ENTRY_NOT_FOUND",
                    {
                        id,
                        model: modelId
                    }
                );
            }
            const { id: entryId } = parseIdentifier(id);
            records[id] = {
                id,
                entryId,
                modelId
            };
        }
    }

    /**
     * In the end, assign the entryId, id and model values to the output.
     */
    for (const id in pathsByReferenceId) {
        const entry = records[id];
        const paths = pathsByReferenceId[id];
        if (!entry) {
            if (validateEntries === true) {
                throw new WebinyError("Missing entry in records.", "ENTRY_ERROR", {
                    id,
                    paths
                });
            }
            continue;
        }
        for (const path of paths) {
            output = dotProp.set(output, path, {
                id: entry.id,
                entryId: entry.entryId,
                modelId: entry.modelId
            });
        }
    }

    return output;
};
