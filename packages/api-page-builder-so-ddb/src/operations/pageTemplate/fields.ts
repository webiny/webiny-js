import { PageTemplateDynamoDbFieldPlugin } from "~/plugins/definitions/PageTemplateDynamoDbFieldPlugin";

export const createPageTemplateDynamoDbFields = (): PageTemplateDynamoDbFieldPlugin[] => {
    return [
        new PageTemplateDynamoDbFieldPlugin({
            field: "id"
        }),
        new PageTemplateDynamoDbFieldPlugin({
            field: "createdOn",
            type: "date"
        }),
        new PageTemplateDynamoDbFieldPlugin({
            field: "savedOn",
            type: "date"
        }),
        new PageTemplateDynamoDbFieldPlugin({
            field: "createdBy",
            path: "createdBy.id"
        })
    ];
};
