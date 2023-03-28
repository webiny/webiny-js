import { Table } from "dynamodb-toolbox";
import { createLegacyEntity } from "~/utils";

const attributes: Parameters<typeof createLegacyEntity>[2] = {
    PK: {
        type: "string",
        partitionKey: true
    },
    SK: {
        type: "string",
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
    __type: {
        type: "string"
    },
    webinyVersion: {
        type: "string"
    },
    tenant: {
        type: "string"
    },
    entryId: {
        type: "string"
    },
    id: {
        type: "string"
    },
    createdBy: {
        type: "map"
    },
    ownedBy: {
        type: "map"
    },
    modifiedBy: {
        type: "map"
    },
    createdOn: {
        type: "string"
    },
    savedOn: {
        type: "string"
    },
    modelId: {
        type: "string"
    },
    locale: {
        type: "string"
    },
    publishedOn: {
        type: "string"
    },
    version: {
        type: "number"
    },
    locked: {
        type: "boolean"
    },
    status: {
        type: "string"
    },
    values: {
        type: "map"
    },
    meta: {
        type: "map"
    },
};

export const createEntryEntity = (table: Table) => {
    return createLegacyEntity(table, "CmsEntries", attributes);
};
