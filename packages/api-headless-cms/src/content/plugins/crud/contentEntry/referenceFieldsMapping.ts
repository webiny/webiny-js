import { CmsContext, CmsEntry, CmsModel, CmsModelField } from "~/types";
import WebinyError from "@webiny/error";
import { parseIdentifier } from "@webiny/utils";
import dotProp from "dot-prop";

interface ReferenceObject {
    id: string;
    modelId: string;
}
interface Params {
    context: CmsContext;
    model: CmsModel;
    input: Record<string, ReferenceObject | ReferenceObject[]>;
}

/**
 * We need to filter the ref fields.
 * Because we have nested fields option, we must go through the object field as well.
 */
const filterApplicableFields = (
    fields: CmsModelField[],
    parentPath: string = null
): Record<string, CmsModelField> => {
    let referenceFields = {};
    for (const field of fields) {
        const isRef = field.type === "ref";
        const isObj = field.type === "object";
        if (!isRef && !isObj) {
            continue;
        }
        /**
         *
         */
        const path = parentPath ? `${parentPath}.${field.fieldId}` : field.fieldId;
        if (isRef === true) {
            referenceFields[path] = field;
            continue;
        }
        /**
         *
         */
        if (!field.settings || Array.isArray(field.settings.fields) === false) {
            continue;
        }

        referenceFields = {
            ...referenceFields,
            ...filterApplicableFields(field.settings.fields, path)
        };
    }
    return referenceFields;
};

interface CreateReferenceFieldPathsParams {
    fields: CmsModelField[];
    parent?: CmsModelFieldWithParent;
    input: Record<string, any>;
}

interface CmsModelFieldWithParent extends CmsModelField {
    parent?: CmsModelFieldWithParent;
    path: string;
    value: any;
}

const createReferenceFieldPaths = (params: CreateReferenceFieldPathsParams) => {
    const { input, fields, parent } = params;

    let result: Record<string, CmsModelFieldWithParent> = {};

    for (const field of fields) {
        const isRef = field.type === "ref";
        const isObj = field.type === "object";
        if (!isRef && !isObj) {
            continue;
        }
        const path = `${parent ? `${parent.path}.${parent.multipleValues ? "%s." : ""}` : ""}${
            field.fieldId
        }`;
        if (isObj === true) {
            if (!field.settings || Array.isArray(field.settings.fields) === false) {
                continue;
            }
            const objectResults = createReferenceFieldPaths({
                fields: field.settings.fields,
                input,
                parent: {
                    ...field,
                    parent,
                    path,
                    value: dotProp.get(input, path, field.multipleValues ? [] : null)
                }
            });
            result = {
                ...result,
                ...objectResults
            };
            continue;
        }

        result[path] = {
            ...field,
            parent,
            path,
            value: dotProp.get(input, path, null)
        };
    }

    return result;
};

interface GetReferenceValuesParams {
    paths: Record<string, any>;
    input: Record<string, any>;
}
const getReferenceValues = (params: GetReferenceValuesParams) => {
    const { paths, input } = params;
    return Object.keys(paths).reduce((collection, path) => {
        const field = paths[path];

        if (field.parent && field.parent.multipleValues) {
            const values = dotProp.get(input, field.parent.path, []);
            if (Array.isArray(values) === false || values.length === 0) {
                return collection;
            }
            for (const key in values) {
                collection[`${field.parent.path}.${key}.${field.fieldId}`] = dotProp.get(
                    input,
                    `${field.parent.path}.${key}.${field.fieldId}`
                );
            }
            return collection;
        }
        const value = dotProp.get(input, field.path);
        if (Array.isArray(value)) {
            for (const i in value) {
                collection[`${path}.${i}`] = value[i];
            }
            return collection;
        }

        collection[path] = value;

        return collection;
    }, {});
};

interface GetReferencesByModelParams {
    values: Record<string, any>;
}
const getReferencesByModel = (params: GetReferencesByModelParams) => {
    const { values } = params;
    const references: Record<string, string[]> = {};
    for (const path in values) {
        if (values.hasOwnProperty(path) === false) {
            continue;
        }
        const value = values[path];
        if (!value) {
            continue;
        }
        const { modelId, id } = value;
        if (!id) {
            throw new WebinyError("Missing id on the reference field.", "MALFORMED_REF_FIELD", {
                value,
                modelId,
                path
            });
        } else if (!modelId) {
            throw new WebinyError("Missing model on the reference field.", "MALFORMED_REF_FIELD", {
                value,
                modelId,
                path
            });
        }
        const { version } = parseIdentifier(id);
        if (!version) {
            throw new WebinyError(
                "Missing ID with a version attached on the reference field.",
                "MALFORMED_REF_FIELD",
                {
                    value,
                    path,
                    modelId
                }
            );
        }
        if (!references[modelId]) {
            references[modelId] = [];
        }
        if (references[modelId].includes(id)) {
            continue;
        }
        references[modelId].push(id);
    }
    return references;
};

export const referenceFieldsMapping = async (params: Params): Promise<Record<string, any>> => {
    const { context, model, input } = params;

    let output: Record<string, any> = {
        ...input
    };

    const referenceFields = filterApplicableFields(model.fields);

    const referencePaths = createReferenceFieldPaths({
        fields: model.fields,
        input
    });

    /**
     * No point in going further if there are no ref fields.
     */
    if (Object.keys(referenceFields).length === 0) {
        return output;
    }

    const referenceValues = getReferenceValues({
        paths: referencePaths,
        input
    });
    /**
     * We need to find all the models and IDs that are referenced.
     * This will produce a list of entries that need to be verified, grouped by a model.
     */
    const references = getReferencesByModel({
        values: referenceValues
    });
    /**
     * Again, no point in going further.
     */
    if (Object.keys(references).length === 0) {
        return output;
    }
    /**
     * Load all models and use only those that are used in reference.
     */
    const models = (await context.cms.listModels()).filter(model => {
        const entries = references[model.modelId];
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
        return context.cms.getEntriesByIds(model, references[model.modelId]);
    });

    const results = await Promise.all(promises);

    const records: Record<string, CmsEntry> = results.reduce((collection, entries) => {
        for (const entry of entries) {
            collection[entry.id] = entry;
        }
        return collection;
    }, {});
    /**
     * Verify that all referenced entries actually exist.
     */
    for (const m in references) {
        const entries = references[m];
        for (const entry of entries) {
            if (records[entry]) {
                continue;
            }
            throw new WebinyError(
                `Missing referenced entry with id "${entry}" in model "${m}".`,
                "ENTRY_NOT_FOUND",
                {
                    entry,
                    model: m
                }
            );
        }
    }

    /**
     * In the end, assign the entryId, id and model values to the input.
     */
    for (const path in referenceValues) {
        if (referenceValues.hasOwnProperty(path) === false) {
            continue;
        }
        const value = referenceValues[path];
        if (!value) {
            continue;
        }

        const { id } = referenceValues[path];

        const entry = records[id];
        if (!entry) {
            throw new WebinyError(`Missing record with id "${id}".`, "RECORDS_ERROR", {
                id
            });
        }

        output = dotProp.set(output, path, {
            id: entry.id,
            entryId: entry.entryId,
            modelId: entry.modelId
        });
    }
    return output;
};
