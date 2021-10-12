import { CategoryDynamoDbFieldPlugin } from "~/plugins/definitions/CategoryDynamoDbFieldPlugin";

export default () => {
    return [
        new CategoryDynamoDbFieldPlugin({
            field: "id"
        }),
        new CategoryDynamoDbFieldPlugin({
            field: "createdOn",
            type: "date"
        }),
        new CategoryDynamoDbFieldPlugin({
            field: "savedOn",
            type: "date"
        }),
        new CategoryDynamoDbFieldPlugin({
            field: "publishedOn",
            type: "date"
        }),
        new CategoryDynamoDbFieldPlugin({
            field: "createdBy",
            path: "createdBy.id"
        })
    ];
};
