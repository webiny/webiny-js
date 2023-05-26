import { SEARCH_RECORD_MODEL_ID } from "@webiny/api-aco";
import { CmsElasticsearchModelFieldPlugin } from "@webiny/api-headless-cms-ddb-es/plugins/CmsElasticsearchModelFieldPlugin";

export const createFieldsPlugins = () => {
    return [
        new CmsElasticsearchModelFieldPlugin({
            fieldType: "text",
            fieldId: "something",
            unmappedType: "string",
            path: "wby-aco-json@data.something",
            models: {
                include: [SEARCH_RECORD_MODEL_ID]
            },
            searchable: true,
            sortable: true,
            keyword: true
        }),
        new CmsElasticsearchModelFieldPlugin({
            fieldType: "number",
            fieldId: "num",
            unmappedType: "long",
            path: "wby-aco-json@data.num",
            models: {
                include: [SEARCH_RECORD_MODEL_ID]
            },
            searchable: true,
            sortable: true,
            keyword: false
        })
    ];
};
