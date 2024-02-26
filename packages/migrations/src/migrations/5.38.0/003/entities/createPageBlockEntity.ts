import { Table, AttributeDefinitions } from "@webiny/db-dynamodb/toolbox";
import { createLegacyEntity } from "~/utils";

const oldAttributes: AttributeDefinitions = {
    PK: {
        partitionKey: true
    },
    SK: {
        sortKey: true
    },
    TYPE: {
        type: "string"
    },
    id: {
        type: "string"
    },
    name: {
        type: "string"
    },
    blockCategory: {
        type: "string"
    },
    content: {
        type: "map"
    },
    preview: {
        type: "map"
    },
    createdOn: {
        type: "string"
    },
    createdBy: {
        type: "map"
    },
    tenant: {
        type: "string"
    },
    locale: {
        type: "string"
    }
};

export const createOldPageBlockEntity = (table: Table<string, string, string>) => {
    return createLegacyEntity(table, "PbPageBlocks", oldAttributes);
};

export const createNewPageBlockEntity = (table: Table<string, string, string>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { preview, ...attrs } = oldAttributes;

    return createLegacyEntity(table, "PbPageBlocks", {
        ...attrs,
        GSI1_PK: {
            type: "string"
        },
        GSI1_SK: {
            type: "string"
        }
    });
};
