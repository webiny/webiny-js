import { BlockCategoryDynamoDbFieldPlugin } from "~/plugins/definitions/BlockCategoryDynamoDbFieldPlugin";

export const createBlockCategoryDynamoDbFields = (): BlockCategoryDynamoDbFieldPlugin[] => {
    return [
        new BlockCategoryDynamoDbFieldPlugin({
            field: "id"
        }),
        new BlockCategoryDynamoDbFieldPlugin({
            field: "createdOn",
            type: "date"
        }),
        new BlockCategoryDynamoDbFieldPlugin({
            field: "savedOn",
            type: "date"
        }),
        new BlockCategoryDynamoDbFieldPlugin({
            field: "publishedOn",
            type: "date"
        }),
        new BlockCategoryDynamoDbFieldPlugin({
            field: "createdBy",
            path: "createdBy.id"
        })
    ];
};
