import type { ModelFields } from "~/operations/entry/elasticsearch/types.js";

interface Params {
    fields: ModelFields;
    term?: string;
    targets?: string[];
}
export const createFullTextSearchFields = (params: Params): ModelFields => {
    const { term, targets, fields } = params;
    if (!targets?.length || !term || term.trim().length === 0) {
        return {};
    }

    const result: ModelFields = {};
    for (const key in fields) {
        if (targets.includes(key) === false) {
            continue;
        }
        result[key] = fields[key];
    }
    return result;
};
