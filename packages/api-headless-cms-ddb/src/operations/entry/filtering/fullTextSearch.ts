import WebinyError from "@webiny/error";
import { ValueFilterPlugin } from "@webiny/db-dynamodb/plugins/definitions/ValueFilterPlugin";
import { CmsEntry } from "@webiny/api-headless-cms/types";
import { Field } from "./types";
import { getValue } from "./getValue";

interface Params {
    term?: string;
    targetFields?: string[];
    fields: Record<string, Field>;
    plugin: ValueFilterPlugin;
}

/**
 * Unfortunately we must use the contains plugin directly as plugins do not support multi field searching.
 */
export const createFullTextSearch = (params: Params) => {
    const { term, targetFields, fields: fieldDefinitions, plugin } = params;
    if (!term || term.trim().length === 0 || !targetFields || targetFields.length === 0) {
        return null;
    }
    return (item: CmsEntry) => {
        for (const target of targetFields) {
            /**
             * As fields is a mapped Field objects where key is a path to the value, we can directly find the related field.
             */
            const field = fieldDefinitions[target];

            if (!field) {
                throw new WebinyError(`Unknown field "${target}" in the model.`, "UNKNOWN_FIELD", {
                    target
                });
            }
            const value = getValue(item.values, target);
            if (!value) {
                continue;
            }
            if (plugin.matches({ value, compareValue: term }) === true) {
                return true;
            }
        }
        return false;
    };
};
