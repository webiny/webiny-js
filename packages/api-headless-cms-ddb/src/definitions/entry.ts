import { Entity, Table } from "@webiny/db-dynamodb/toolbox";
import { Attributes } from "~/types";

interface Params {
    table: Table<string, string, string>;
    entityName: string;
    attributes: Attributes;
}

export const createEntryEntity = (params: Params): Entity<any> => {
    const { table, entityName, attributes } = params;
    return new Entity({
        name: entityName,
        table,
        attributes: {
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
            revisionModifiedOn: { type: "string" },
            revisionSavedOn: { type: "string" },
            revisionDeletedOn: { type: "string" },
            revisionRestoredOn: { type: "string" },
            revisionFirstPublishedOn: { type: "string" },
            revisionLastPublishedOn: { type: "string" },
            revisionCreatedBy: { type: "map" },
            revisionModifiedBy: { type: "map" },
            revisionSavedBy: { type: "map" },
            revisionDeletedBy: { type: "map" },
            revisionRestoredBy: { type: "map" },
            revisionFirstPublishedBy: { type: "map" },
            revisionLastPublishedBy: { type: "map" },

            /**
             * Entry-level meta fields. 👇
             */
            createdOn: { type: "string" },
            modifiedOn: { type: "string" },
            savedOn: { type: "string" },
            deletedOn: { type: "string" },
            restoredOn: { type: "string" },
            firstPublishedOn: { type: "string" },
            lastPublishedOn: { type: "string" },
            createdBy: { type: "map" },
            modifiedBy: { type: "map" },
            savedBy: { type: "map" },
            deletedBy: { type: "map" },
            restoredBy: { type: "map" },
            firstPublishedBy: { type: "map" },
            lastPublishedBy: { type: "map" },

            version: {
                type: "number"
            },
            locked: {
                type: "boolean"
            },
            status: {
                type: "string"
            },
            location: {
                type: "map"
            },
            wbyDeleted: {
                type: "boolean"
            },
            binOriginalFolderId: {
                type: "string"
            },
            values: {
                type: "map"
            },
            meta: {
                type: "map"
            },
            ...(attributes || {})
        }
    });
};
