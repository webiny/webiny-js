import { PageElementDynamoDbFieldPlugin } from "~/plugins/definitions/PageElementDynamoDbFieldPlugin";

export default () => [
    new PageElementDynamoDbFieldPlugin({
        field: "createdOn",
        type: "date"
    }),
    new PageElementDynamoDbFieldPlugin({
        field: "createdBy",
        path: "createdBy.id"
    })
];
