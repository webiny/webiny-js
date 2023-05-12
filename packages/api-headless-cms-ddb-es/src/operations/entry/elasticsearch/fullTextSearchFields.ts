import { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types";

interface Params {
    model: CmsModel;
    term?: string;
    fields?: string[];
}
export const createFullTextSearchFields = (params: Params): CmsModelField[] => {
    const { term, model, fields } = params;
    if (!fields || fields.length === 0 || !term || term.trim().length === 0) {
        return [];
    }
    return fields.reduce<CmsModelField[]>((collection, fieldId) => {
        const field = model.fields.find(f => f.fieldId === fieldId);
        if (!field) {
            return collection;
        }
        collection.push(field);
        return collection;
    }, []);
};
