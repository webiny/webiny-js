import { FileDynamoDbFieldPlugin } from "~/plugins/FileDynamoDbFieldPlugin";

export const createFileFieldsPlugins = () => [
    new FileDynamoDbFieldPlugin({
        field: "id"
    }),
    /**
     * Path plugin for the field that are ddb map type and the value filtered by is the id property in the object.
     */
    new FileDynamoDbFieldPlugin({
        field: "createdBy",
        path: "createdBy.id"
    }),
    /**
     * Path plugin for meta field properties.
     */
    new FileDynamoDbFieldPlugin({
        field: "private",
        path: "meta.private"
    }),
    /**
     * Path plugin for tag field.
     */
    new FileDynamoDbFieldPlugin({
        field: "tag",
        path: "tags"
    }),
    /**
     * Value transformation for the dateTime field.
     */
    new FileDynamoDbFieldPlugin({
        field: "createdOn",
        type: "date"
    })
];
