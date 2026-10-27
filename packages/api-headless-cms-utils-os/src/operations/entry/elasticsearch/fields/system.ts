import type { ModelFieldParent, ModelFields } from "~/operations/entry/elasticsearch/types.js";
import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import { createSystemField } from "./createSystemField.js";

const systemParent: ModelFieldParent = {
    fieldId: "system",
    type: "object",
    storageId: "system"
};

/**
 * ObjectFilter resolves one level at a time, so every nested object needs its own entry.
 */
const addFields = (result: ModelFields, fields: CmsModelField[], parents: ModelFieldParent[]) => {
    for (const field of fields) {
        const path = [...parents.map(parent => parent.fieldId), field.fieldId].join(".");
        result[path] = {
            type: field.type,
            systemField: true,
            searchable: true,
            sortable: false,
            parents,
            field
        };
        const children = field.settings?.fields;
        if (!children?.length) {
            continue;
        }
        addFields(result, children, [
            ...parents,
            {
                fieldId: field.fieldId,
                type: field.type,
                storageId: field.storageId
            }
        ]);
    }
};

/**
 * Filter fields for the fields registered as `CmsEntrySystemField`. The `system` object is indexed
 * as-is (raw storage ids), so a text field resolves to `system.<path>.keyword`.
 */
export const createEntrySystemFields = (fields: CmsModelField[]): ModelFields => {
    if (fields.length === 0) {
        return {};
    }
    const result: ModelFields = {
        system: {
            type: "object",
            systemField: true,
            searchable: true,
            sortable: false,
            field: createSystemField({
                storageId: "system",
                fieldId: "system",
                type: "object",
                settings: {
                    fields
                }
            }),
            parents: []
        }
    };
    addFields(result, fields, [systemParent]);
    return result;
};
