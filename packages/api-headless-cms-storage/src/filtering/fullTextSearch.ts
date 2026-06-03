import WebinyError from "@webiny/error";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { Field } from "./fields/types.js";
import { getValue } from "./getValue.js";
import { ValueFilter } from "@webiny/db-utils";

interface Params {
    term?: string;
    targetFields?: string[];
    fields: Record<string, Field>;
    filter: ValueFilter.Interface;
}

/* Unfortunately we must use the contains plugin directly as plugins do not support multi field searching. */
export const createFullTextSearch = (params: Params) => {
    const { term, targetFields, fields: fieldDefinitions, filter } = params;
    if (!term || term.trim().length === 0 || !targetFields || targetFields.length === 0) {
        return null;
    }
    return (item: CmsEntry) => {
        for (const target of targetFields) {
            /* As fields is a mapped Field objects where key is a path to the value, we can directly find the related field. */
            const field = fieldDefinitions[target];

            if (!field) {
                throw new WebinyError(`Unknown field "${target}" in the model.`, "UNKNOWN_FIELD", {
                    target
                });
            }
            const value = getValue(item, target);
            if (!value) {
                continue;
            }
            if (filter.matches({ value, compareValue: term }) === true) {
                return true;
            }
        }
        return false;
    };
};
