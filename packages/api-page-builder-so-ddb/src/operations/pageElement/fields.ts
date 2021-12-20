import { PageElementDynamoDbFieldPlugin } from "~/plugins/definitions/PageElementDynamoDbFieldPlugin";

export const createPageElementDynamoDbFields = (): PageElementDynamoDbFieldPlugin[] => [
    new PageElementDynamoDbFieldPlugin({
        field: "createdOn",
        type: "date"
    }),
    new PageElementDynamoDbFieldPlugin({
        field: "createdBy",
        path: "createdBy.id",
        sortable: false
    })
];
