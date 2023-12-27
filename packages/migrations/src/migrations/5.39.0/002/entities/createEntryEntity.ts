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
     * 🚫 Deprecated meta fields below.
     * Will be fully removed in one of the next releases.
     */
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
    publishedOn: {
        type: "string"
    },

    /**
     * 🆕 New meta fields below.
     * Users are encouraged to use these instead of the deprecated ones above.
     */

    /**
     * Revision-level meta fields. 👇
     */
    revisionCreatedOn: { type: "string" },
    revisionSavedOn: { type: "string" },
    revisionModifiedOn: { type: "string" },
    revisionFirstPublishedOn: { type: "string" },
    revisionLastPublishedOn: { type: "string" },
    revisionCreatedBy: { type: "map" },
    revisionSavedBy: { type: "map" },
    revisionModifiedBy: { type: "map" },
    revisionFirstPublishedBy: { type: "map" },
    revisionLastPublishedBy: { type: "map" },

    /**
     * Entry-level meta fields. 👇
     */
    entryCreatedOn: { type: "string" },
    entrySavedOn: { type: "string" },
    entryModifiedOn: { type: "string" },
    entryFirstPublishedOn: { type: "string" },
    entryLastPublishedOn: { type: "string" },
    entryCreatedBy: { type: "map" },
    entrySavedBy: { type: "map" },
    entryModifiedBy: { type: "map" },
    entryFirstPublishedBy: { type: "map" },
    entryLastPublishedBy: { type: "map" },

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
