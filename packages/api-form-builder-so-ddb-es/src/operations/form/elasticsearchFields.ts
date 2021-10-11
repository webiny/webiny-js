import { FormElasticsearchFieldPlugin } from "~/plugins/FormElasticsearchFieldPlugin";

export default () => [
    new FormElasticsearchFieldPlugin({
        field: "createdOn",
        unmappedType: "date"
    }),
    new FormElasticsearchFieldPlugin({
        field: "savedOn",
        unmappedType: "date"
    }),
    new FormElasticsearchFieldPlugin({
        field: "publishedOn",
        unmappedType: "date"
    }),
    new FormElasticsearchFieldPlugin({
        field: "ownedBy",
        path: "ownedBy.id"
    }),
    /**
     * Always add the ALL fields plugin because of the keyword/path build.
     */
    new FormElasticsearchFieldPlugin({
        field: FormElasticsearchFieldPlugin.ALL
    })
];
