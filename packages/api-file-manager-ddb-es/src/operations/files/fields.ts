import { ElasticsearchFieldPlugin } from "@webiny/api-elasticsearch/plugins/definition";

export default () => [
    new ElasticsearchFieldPlugin({
        field: "createdAt",
        unmappedType: "date"
    }),
    new ElasticsearchFieldPlugin({
        field: "createdBy",
        path: "createdBy.id"
    }),
    new ElasticsearchFieldPlugin({
        field: "private",
        path: "meta.private",
        keyword: false
    }),
    new ElasticsearchFieldPlugin({
        field: "size",
        keyword: false
    }),
    /**
     * Defines all fields that are not strictly defined.
     */
    new ElasticsearchFieldPlugin({
        field: "*"
    })
];
