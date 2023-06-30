import { PageElasticsearchFieldPlugin } from "~/plugins/definitions/PageElasticsearchFieldPlugin";
import { PageDynamoDbElasticsearchFieldPlugin } from "~/plugins/definitions/PageDynamoDbElasticsearchFieldPlugin";

export const createPagesElasticsearchFields = (): PageElasticsearchFieldPlugin[] => [
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
    new PageElasticsearchFieldPlugin({
        field: "path",
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

export const createPagesDynamoDbFields = (): PageDynamoDbElasticsearchFieldPlugin[] => {
    return [
        new PageDynamoDbElasticsearchFieldPlugin({
            field: "version",
            type: "number",
            sortable: true
        })
    ];
};
