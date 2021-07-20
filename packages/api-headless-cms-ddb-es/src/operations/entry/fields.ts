import { CmsContentModel } from "@webiny/api-headless-cms/types";
import { ElasticsearchFieldPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchFieldPlugin";

const entity = "ContentElasticsearchEntry";
const fieldsWithKeywords = ["text", "long-text", "rich-text", "id", "ref"];

const hasKeyword = (type: string): boolean => {
    return fieldsWithKeywords.includes(type);
};

export const createElasticsearchFields = (
    model: CmsContentModel
): Record<string, ElasticsearchFieldPlugin> => {
    /**
     * We need to map entry system fields that have different paths, no keyword or not sortable.
     */
    const systemFields = {
        createdBy: new ElasticsearchFieldPlugin({
            field: "createdBy",
            path: "createdBy.id",
            entity,
            searchable: true,
            keyword: true,
            sortable: false
        }),
        ownedBy: new ElasticsearchFieldPlugin({
            field: "ownedBy",
            path: "ownedBy.id",
            entity,
            searchable: true,
            keyword: true,
            sortable: false
        }),
        createdOn: new ElasticsearchFieldPlugin({
            field: "createdOn",
            path: "createdOn",
            entity,
            searchable: true,
            keyword: false,
            sortable: false,
            unmappedType: "date"
        }),
        savedOn: new ElasticsearchFieldPlugin({
            field: "savedOn",
            path: "savedOn",
            entity,
            searchable: true,
            keyword: false,
            sortable: false,
            unmappedType: "date"
        })
    };
    return model.fields.reduce((fields, field) => {
        fields[field.fieldId] = new ElasticsearchFieldPlugin({
            field: field.fieldId,
            path: `values.${field.fieldId}`,
            entity,
            searchable: true,
            keyword: hasKeyword(field.type)
        });

        return fields;
    }, systemFields);
};
