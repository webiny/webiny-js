// TODO @bruno Verify that this file is required?
import { CmsModel } from "@webiny/api-headless-cms/types";
import { CmsEntryElasticsearchFieldPlugin } from "~/plugins/CmsEntryElasticsearchFieldPlugin";

const fieldsWithKeywords = ["text", "long-text", "rich-text", "id", "ref"];

/**
 * We need to map entry system fields that have different paths, no keyword or not sortable.
 */
const systemFields: Record<string, CmsEntryElasticsearchFieldPlugin> = {
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
    }),
    version: new CmsEntryElasticsearchFieldPlugin({
        field: "version",
        path: "version",
        sortable: true,
        searchable: true,
        keyword: false,
        unmappedType: "number"
    })
};

export const createElasticsearchFields = (
    model: CmsModel
): Record<string, CmsEntryElasticsearchFieldPlugin> => {
    return model.fields.reduce((fields, field) => {
        fields[field.storageId] = new CmsEntryElasticsearchFieldPlugin({
            field: field.storageId,
            path: `values.${field.storageId}`,
            searchable: true,
            keyword: fieldsWithKeywords.includes(field.type)
        });

        return fields;
    }, systemFields);
};
