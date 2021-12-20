import { CategoryDynamoDbElasticFieldPlugin } from "~/plugins/definitions/CategoryDynamoDbElasticFieldPlugin";

export const createCategoryDynamoDbFields = (): CategoryDynamoDbElasticFieldPlugin[] => {
    return [
        new CategoryDynamoDbElasticFieldPlugin({
            field: "id"
        }),
        new CategoryDynamoDbElasticFieldPlugin({
            field: "createdOn",
            type: "date"
        }),
        new CategoryDynamoDbElasticFieldPlugin({
            field: "savedOn",
            type: "date"
        }),
        new CategoryDynamoDbElasticFieldPlugin({
            field: "publishedOn",
            type: "date"
        }),
        new CategoryDynamoDbElasticFieldPlugin({
            field: "createdBy",
            path: "createdBy.id"
        })
    ];
};
