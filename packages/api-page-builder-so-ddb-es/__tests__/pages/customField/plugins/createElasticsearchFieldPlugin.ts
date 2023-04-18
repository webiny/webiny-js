import { PageElasticsearchFieldPlugin } from "~/index";

export const createElasticsearchFieldPlugin = () => {
    return new PageElasticsearchFieldPlugin({
        field: "customViews",
        path: "customStoredViews",
        keyword: false,
        unmappedType: "long",
        sortable: true,
        searchable: true
    });
};
