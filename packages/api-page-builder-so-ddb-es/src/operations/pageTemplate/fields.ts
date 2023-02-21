import { PageTemplateDynamoDbElasticFieldPlugin } from "~/plugins/definitions/PageTemplateDynamoDbElasticFieldPlugin";

export const createPageTemplateDynamoDbFields = (): PageTemplateDynamoDbElasticFieldPlugin[] => {
    return [
        new PageTemplateDynamoDbElasticFieldPlugin({
            field: "id"
        }),
        new PageTemplateDynamoDbElasticFieldPlugin({
            field: "createdOn",
            type: "date"
        }),
        new PageTemplateDynamoDbElasticFieldPlugin({
            field: "savedOn",
            type: "date"
        }),
        new PageTemplateDynamoDbElasticFieldPlugin({
            field: "createdBy",
            path: "createdBy.id"
        })
    ];
};
