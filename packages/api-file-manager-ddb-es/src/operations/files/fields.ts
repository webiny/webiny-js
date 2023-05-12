import { FileElasticsearchFieldPlugin } from "~/plugins/FileElasticsearchFieldPlugin";

export const createFileFieldsPlugins = () => [
    new FileElasticsearchFieldPlugin({
        field: "id",
        unmappedType: "string",
        keyword: true
    }),
    new FileElasticsearchFieldPlugin({
        field: "createdOn",
        unmappedType: "date"
    }),
    new FileElasticsearchFieldPlugin({
        field: "createdBy",
        path: "createdBy.id"
    }),
    new FileElasticsearchFieldPlugin({
        field: "private",
        path: "meta.private",
        keyword: false
    }),
    new FileElasticsearchFieldPlugin({
        field: "size",
        keyword: false
    }),
    new FileElasticsearchFieldPlugin({
        field: "tag",
        path: "tags",
        keyword: true
    }),
    /**
     * Defines all fields that are not strictly defined.
     */
    new FileElasticsearchFieldPlugin({
        field: "*"
    })
];
