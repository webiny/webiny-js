import { Table, AttributeDefinitions } from "@webiny/db-dynamodb/toolbox";
import { createLegacyEntity } from "~/utils";

const attributes: AttributeDefinitions = {
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
    },
    GSI1_PK: {
        type: "string"
    },
    GSI1_SK: {
        type: "string"
    }
};

export const createBlockEntity = (table: Table<string, string, string>) => {
    return createLegacyEntity(table, "PbPageBlocks", attributes);
};
