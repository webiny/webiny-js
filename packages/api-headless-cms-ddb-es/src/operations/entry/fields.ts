import { CmsContentModel } from "@webiny/api-headless-cms/types";
import { CmsEntryElasticsearchFieldPlugin } from "~/plugins/CmsEntryElasticsearchFieldPlugin";

const fieldsWithKeywords = ["text", "long-text", "rich-text", "id", "ref"];

/**
 * We need to map entry system fields that have different paths, no keyword or not sortable.
 */
const systemFields = {
    createdBy: new CmsEntryElasticsearchFieldPlugin({
        field: "createdBy",
        path: "createdBy.id",
        searchable: true,
        keyword: true,
        sortable: false
    }),
    ownedBy: new CmsEntryElasticsearchFieldPlugin({
        field: "ownedBy",
        path: "ownedBy.id",
        searchable: true,
        keyword: true,
        sortable: false
    }),
    createdOn: new CmsEntryElasticsearchFieldPlugin({
        field: "createdOn",
        path: "createdOn",
        searchable: true,
        keyword: false,
        sortable: false,
        unmappedType: "date"
    }),
    savedOn: new CmsEntryElasticsearchFieldPlugin({
        field: "savedOn",
        path: "savedOn",
        searchable: true,
        keyword: false,
        sortable: false,
        unmappedType: "date"
    })
};

export const createElasticsearchFields = (
    model: CmsContentModel
): Record<string, CmsEntryElasticsearchFieldPlugin> => {
    return model.fields.reduce((fields, field) => {
        fields[field.fieldId] = new CmsEntryElasticsearchFieldPlugin({
            field: field.fieldId,
            path: `values.${field.fieldId}`,
            searchable: true,
            keyword: fieldsWithKeywords.includes(field.type)
        });

        return fields;
    }, systemFields);
};
