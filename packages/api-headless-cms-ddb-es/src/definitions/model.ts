import { Table, Entity } from "dynamodb-toolbox";

export default (table: Table): Entity<any> => {
    return new Entity({
        name: "ContentModel",
        table,
        attributes: {
            PK: {
                partitionKey: true
            },
            SK: {
                sortKey: true
            },
            TYPE: {
                type: "string"
            },
            webinyVersion: {
                type: "string"
            },
            name: {
                type: "string"
            },
            modelId: {
                type: "string"
            },
            locale: {
                type: "string"
            },
            group: {
                type: "map"
            },
            description: {
                type: "string"
            },
            createdOn: {
                type: "string"
            },
            savedOn: {
                type: "string"
            },
            createdBy: {
                type: "map"
            },
            fields: {
                type: "list"
            },
            layout: {
                type: "list"
            },
            lockedFields: {
                type: "list"
            },
            titleFieldId: {
                type: "string"
            }
        }
    });
};
