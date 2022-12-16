import WebinyError from "@webiny/error";
import { ValueFilterPlugin } from "@webiny/db-dynamodb/plugins/definitions/ValueFilterPlugin";
import { CmsEntry } from "@webiny/api-headless-cms/types";
import { Field, FilterItemFromStorage } from "./types";

interface Params {
    term?: string;
    fields?: string[];
    plugin: ValueFilterPlugin;
}

interface FtParams {
    item: CmsEntry;
    fromStorage: FilterItemFromStorage;
    fields: Record<string, Field>;
}
/**
 * Unfortunately we must use the contains plugin directly as plugins do not support multi field searching.
 */
export const createFullTextSearch = ({ term, fields: targetFields, plugin }: Params) => {
    if (!term || term.trim().length === 0 || !targetFields || targetFields.length === 0) {
        return null;
    }
    return async ({ item, fromStorage, fields }: FtParams) => {
        for (const target of targetFields) {
            const field = Object.values(fields).find(field => {
                return field.fieldId === target;
            });
            if (!field) {
                throw new WebinyError(`Unknown field "${target}" in the model.`, "UNKNOWN_FIELD", {
                    target
                });
            }
            const value = await fromStorage(field, item.values[target]);
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
