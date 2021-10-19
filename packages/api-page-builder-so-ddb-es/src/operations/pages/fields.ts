import { PageElasticsearchFieldPlugin } from "~/plugins/definitions/PageElasticsearchFieldPlugin";

export default () => [
    new PageElasticsearchFieldPlugin({
        field: "createdOn",
        unmappedType: "date",
        keyword: false
    }),
    new PageElasticsearchFieldPlugin({
        field: "savedOn",
        unmappedType: "date",
        keyword: false
    }),
    new PageElasticsearchFieldPlugin({
        field: "publishedOn",
        unmappedType: "date",
        keyword: false
    }),
    new PageElasticsearchFieldPlugin({
        field: "createdBy",
        path: "createdBy.id"
    }),
    new PageElasticsearchFieldPlugin({
        field: "ownedBy",
        path: "ownedBy.id"
    }),
    new PageElasticsearchFieldPlugin({
        field: "title",
        path: "titleLC",
        unmappedType: "text",
        keyword: true,
        searchable: true
    }),
    /**
     * Defines all fields that are not strictly defined.
     */
    new PageElasticsearchFieldPlugin({
        field: "*"
    })
];
