import { BlockCategoryDynamoDbElasticFieldPlugin } from "~/plugins/definitions/BlockCategoryDynamoDbElasticFieldPlugin";

export const createBlockCategoryDynamoDbFields = (): BlockCategoryDynamoDbElasticFieldPlugin[] => {
    return [
        new BlockCategoryDynamoDbElasticFieldPlugin({
            field: "id"
        }),
        new BlockCategoryDynamoDbElasticFieldPlugin({
            field: "createdOn",
            type: "date"
        }),
        new BlockCategoryDynamoDbElasticFieldPlugin({
            field: "savedOn",
            type: "date"
        }),
        new BlockCategoryDynamoDbElasticFieldPlugin({
            field: "publishedOn",
            type: "date"
        }),
        new BlockCategoryDynamoDbElasticFieldPlugin({
            field: "createdBy",
            path: "createdBy.id"
        })
    ];
};
