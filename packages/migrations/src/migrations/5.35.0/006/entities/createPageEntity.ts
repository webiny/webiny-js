import { Table } from "dynamodb-toolbox";
import { createLegacyEntity } from "~/utils";

const attributes: Parameters<typeof createLegacyEntity>[2] = {
    PK: {
        partitionKey: true
    },
    SK: {
        sortKey: true
    },
    GSI1_PK: {
        type: "string"
    },
    GSI1_SK: {
        type: "string"
    },
    TYPE: {
        type: "string"
    },
    id: {
        type: "string"
    },
    pid: {
        type: "string"
    },
    tenant: {
        type: "string"
    },
    locale: {
        type: "string"
    },
    title: {
        type: "string"
    },
    titleLC: {
        type: "string"
    },
    editor: {
        type: "string"
    },
    createdFrom: {
        type: "string"
    },
    path: {
        type: "string"
    },
    category: {
        type: "string"
    },
    content: {
        type: "map"
    },
    publishedOn: {
        type: "string"
    },
    version: {
        type: "number"
    },
    settings: {
        type: "map"
    },
    locked: {
        type: "boolean"
    },
    status: {
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
    ownedBy: {
        type: "map"
    },
    webinyVersion: {
        type: "string"
    }
};

export const createPageEntity = (table: Table) => {
    return createLegacyEntity(table, "PbPages", attributes);
};
