/* eslint-disable */
import { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types";

const extractFields = (fields: CmsModelField[]): string[] => {
    return fields.reduce<string[]>((collection, field) => {
        if (field.settings?.fields) {
            collection.push(...extractFields(field.settings.fields));
        } else if (field) {
        }

        return collection;
    }, []);
};

interface Params {
    model: CmsModel;
    term?: string;
    fields?: string[];
}
export const createFullTextSearchFields = (params: Params): CmsModelField[] => {
    const { term, model, fields } = params;
    if (!fields || fields.length === 0 || !term || term.length === 0) {
        return [];
    }
    const fullTextSearchFields: CmsModelField[] = [];
    /**
     * No point in going through fields if there is no search performed - no search term.
     */
    if (!!term) {
        for (const fieldId of fields) {
            const field = model.fields.find(f => f.fieldId === fieldId);
            if (!field) {
                continue;
            }
            fullTextSearchFields.push(field);
        }
    }
    return fullTextSearchFields;
};
