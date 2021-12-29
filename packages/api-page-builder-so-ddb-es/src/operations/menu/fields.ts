import { MenuDynamoDbElasticFieldPlugin } from "~/plugins/definitions/MenuDynamoDbElasticFieldPlugin";

export const createMenuDynamoDbFields = (): MenuDynamoDbElasticFieldPlugin[] => {
    return [
        new MenuDynamoDbElasticFieldPlugin({
            field: "id"
        }),
        new MenuDynamoDbElasticFieldPlugin({
            field: "title"
        }),
        new MenuDynamoDbElasticFieldPlugin({
            field: "slug"
        }),
        new MenuDynamoDbElasticFieldPlugin({
            field: "createdOn",
            type: "date"
        }),
        new MenuDynamoDbElasticFieldPlugin({
            field: "createdBy",
            path: "createdBy.id",
            sortable: false
        })
    ];
};
