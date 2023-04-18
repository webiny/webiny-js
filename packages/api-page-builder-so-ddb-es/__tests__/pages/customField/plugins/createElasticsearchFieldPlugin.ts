import { PageElasticsearchFieldPlugin } from "~/index";

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
