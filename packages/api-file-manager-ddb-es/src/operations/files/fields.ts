import { ElasticsearchFieldPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchFieldPlugin";

const entityName = "FilesElasticsearch";
export default () => [
    new ElasticsearchFieldPlugin({
        entity: entityName,
        field: "createdAt",
        unmappedType: "date"
    }),
    new ElasticsearchFieldPlugin({
        entity: entityName,
        field: "createdBy",
        path: "createdBy.id"
    }),
    new ElasticsearchFieldPlugin({
        entity: entityName,
        field: "private",
        path: "meta.private",
        keyword: false
    }),
    new ElasticsearchFieldPlugin({
        entity: entityName,
        field: "size",
        keyword: false
    }),
    /**
     * Defines all fields that are not strictly defined.
     */
    new ElasticsearchFieldPlugin({
        entity: entityName,
        field: "*"
    })
];
