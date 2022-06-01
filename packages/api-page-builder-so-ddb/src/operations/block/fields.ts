import { BlockDynamoDbFieldPlugin } from "~/plugins/definitions/BlockDynamoDbFieldPlugin";

export const createBlockDynamoDbFields = (): BlockDynamoDbFieldPlugin[] => {
    return [
        new BlockDynamoDbFieldPlugin({
            field: "id"
        }),
        new BlockDynamoDbFieldPlugin({
            field: "createdOn",
            type: "date"
        }),
        new BlockDynamoDbFieldPlugin({
            field: "savedOn",
            type: "date"
        }),
        new BlockDynamoDbFieldPlugin({
            field: "createdBy",
            path: "createdBy.id"
        })
    ];
};
