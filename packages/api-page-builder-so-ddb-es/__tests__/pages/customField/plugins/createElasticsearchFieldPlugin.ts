import { PageElasticsearchFieldPlugin } from "~/index";

/**
 * This plugin will add a new field to the Page Elasticsearch fields.
 * It is required because like this we map the GraphQL field customViews to the Elasticsearch path settings.customViews.
 *
 * It serves as the path for both the filtering and sorting.
 *
 */
export const createElasticsearchFieldPlugin = () => {
    return new PageElasticsearchFieldPlugin({
        field: "customViews",
        path: "settings.customViews",
        keyword: false,
        unmappedType: "long",
        sortable: true,
        searchable: true
    });
};
