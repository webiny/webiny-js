import { FormDynamoDbFieldPlugin } from "~/plugins/FormDynamoDbFieldPlugin";

export default () => [
    new FormDynamoDbFieldPlugin({
        field: "publishedOn",
        type: "date"
    }),
    new FormDynamoDbFieldPlugin({
        field: "createdOn",
        type: "date"
    }),
    new FormDynamoDbFieldPlugin({
        field: "savedOn",
        type: "date"
    }),
    new FormDynamoDbFieldPlugin({
        field: "name"
    }),
    new FormDynamoDbFieldPlugin({
        field: "slug"
    }),
    new FormDynamoDbFieldPlugin({
        field: "locale"
    }),
    new FormDynamoDbFieldPlugin({
        field: "tenant"
    }),
    new FormDynamoDbFieldPlugin({
        field: "published",
        type: "boolean"
    }),
    new FormDynamoDbFieldPlugin({
        field: "status"
    }),
    new FormDynamoDbFieldPlugin({
        field: "version",
        type: "number"
    }),
    new FormDynamoDbFieldPlugin({
        field: "ownedBy",
        path: "ownedBy.id"
    }),
    new FormDynamoDbFieldPlugin({
        field: "createdBy",
        path: "createdBy.id"
    })
];
