import { PageDynamoDbFieldPlugin } from "~/plugins/definitions/PageDynamoDbFieldPlugin";

export const createPageFields = (): PageDynamoDbFieldPlugin[] => [
    new PageDynamoDbFieldPlugin({
        field: "id"
    }),
    new PageDynamoDbFieldPlugin({
        field: "title",
        path: "titleLC"
    }),
    new PageDynamoDbFieldPlugin({
        field: "snippet",
        path: "settings.general.snippet"
    }),
    new PageDynamoDbFieldPlugin({
        field: "category"
    }),
    new PageDynamoDbFieldPlugin({
        field: "status"
    }),
    new PageDynamoDbFieldPlugin({
        field: "createdOn",
        type: "date"
    }),
    new PageDynamoDbFieldPlugin({
        field: "savedOn",
        type: "date"
    }),
    new PageDynamoDbFieldPlugin({
        field: "publishedOn",
        type: "date"
    }),
    new PageDynamoDbFieldPlugin({
        field: "createdBy",
        path: "createdBy.id",
        sortable: false
    }),
    new PageDynamoDbFieldPlugin({
        field: "ownedBy",
        path: "ownedBy.id",
        sortable: false
    }),
    new PageDynamoDbFieldPlugin({
        field: "tags",
        path: "settings.general.tags",
        sortable: false
    })
];
