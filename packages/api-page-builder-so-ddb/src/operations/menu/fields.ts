import { MenuDynamoDbFieldPlugin } from "~/plugins/definitions/MenuDynamoDbFieldPlugin";

export const createMenuDynamoDbFields = (): MenuDynamoDbFieldPlugin[] => {
    return [
        new MenuDynamoDbFieldPlugin({
            field: "id"
        }),
        new MenuDynamoDbFieldPlugin({
            field: "title"
        }),
        new MenuDynamoDbFieldPlugin({
            field: "slug"
        }),
        new MenuDynamoDbFieldPlugin({
            field: "createdOn",
            type: "date"
        }),
        new MenuDynamoDbFieldPlugin({
            field: "createdBy",
            path: "createdBy.id",
            sortable: false
        })
    ];
};
