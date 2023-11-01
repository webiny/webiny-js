import { Table } from "dynamodb-toolbox";
import { createLegacyEntity } from "~/utils";

export const createFormSubmissionEntity = (table: Table) => {
    return createLegacyEntity(table, "FormBuilderForm", {
        PK: {
            partitionKey: true
        },
        SK: {
            sortKey: true
        },
        id: {
            type: "string"
        },
        TYPE: {
            type: "string"
        },
        data: {
            type: "map"
        },
        meta: {
            type: "map"
        },
        form: {
            type: "map"
        },
        logs: {
            type: "list"
        },
        createdOn: {
            type: "string"
        },
        savedOn: {
            type: "string"
        },
        ownedBy: {
            type: "map"
        },
        tenant: {
            type: "string"
        },
        locale: {
            type: "string"
        },
        webinyVersion: {
            type: "string"
        }
    });
};
