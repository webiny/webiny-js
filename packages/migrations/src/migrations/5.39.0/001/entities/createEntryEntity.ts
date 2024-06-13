import { Table } from "@webiny/db-dynamodb/toolbox";
import { createLegacyEntity, createStandardEntity } from "~/utils";

const ddbAttributes: Parameters<typeof createLegacyEntity>[2] = {
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
    modelId: {
        type: "string"
    },
    locale: {
        type: "string"
    },

    /**
     * Revision-level meta fields. 👇
     */
    revisionCreatedOn: { type: "string" },
    revisionSavedOn: { type: "string" },
    revisionModifiedOn: { type: "string" },
    revisionDeletedOn: { type: "string" },
    revisionRestoredOn: { type: "string" },
    revisionFirstPublishedOn: { type: "string" },
    revisionLastPublishedOn: { type: "string" },
    revisionCreatedBy: { type: "map" },
    revisionSavedBy: { type: "map" },
    revisionModifiedBy: { type: "map" },
    revisionDeletedBy: { type: "map" },
    revisionRestoredBy: { type: "map" },
    revisionFirstPublishedBy: { type: "map" },
    revisionLastPublishedBy: { type: "map" },

    /**
     * Entry-level meta fields. 👇
     */
    createdOn: { type: "string" },
    savedOn: { type: "string" },
    modifiedOn: { type: "string" },
    deletedOn: { type: "string" },
    restoredOn: { type: "string" },
    firstPublishedOn: { type: "string" },
    lastPublishedOn: { type: "string" },
    createdBy: { type: "map" },
    savedBy: { type: "map" },
    modifiedBy: { type: "map" },
    deletedBy: { type: "map" },
    restoredBy: { type: "map" },
    firstPublishedBy: { type: "map" },
    lastPublishedBy: { type: "map" },

    // Deprecated fields.
    ownedBy: { type: "map" },
    publishedOn: { type: "string" },

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
    location: {
        type: "map"
    }
};

const ddbEsAttributes: Parameters<typeof createStandardEntity>[2] = {
    PK: {
        type: "string",
        partitionKey: true
    },
    SK: {
        type: "string",
        sortKey: true
    },
    index: {
        type: "string"
    },
    data: {
        type: "map"
    }
};

export const createDdbEntryEntity = (table: Table<string, string, string>) => {
    return createLegacyEntity(table, "CmsEntries", ddbAttributes);
};

export const createDdbEsEntryEntity = (table: Table<string, string, string>) => {
    return createStandardEntity(table, "CmsEntriesElasticsearch", ddbEsAttributes);
};
