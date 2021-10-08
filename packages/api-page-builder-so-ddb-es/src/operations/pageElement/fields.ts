import { PageElementDynamoDbElasticFieldPlugin } from "~/plugins/definitions/PageElementDynamoDbElasticFieldPlugin";

export default () => [
    new PageElementDynamoDbElasticFieldPlugin({
        field: "createdOn",
        type: "date"
    }),
    new PageElementDynamoDbElasticFieldPlugin({
        field: "createdBy",
        path: "createdBy.id",
        sortable: false
    })
];
