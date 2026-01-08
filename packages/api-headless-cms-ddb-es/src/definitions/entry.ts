import type { Table } from "@webiny/db-dynamodb/toolbox.js";
import { Entity } from "@webiny/db-dynamodb/toolbox.js";

export interface CreateEntryEntityParams {
    table: Table<string, string, string>;
    entityName: string;
}
export const createEntryEntity = (params: CreateEntryEntityParams): Entity<any> => {
    const { table, entityName } = params;
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
            TYPE: {
                type: "string"
            },
            __type: {
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

            /**
             * Deprecated fields. 👇
             */
            ownedBy: {
                type: "map"
            },
            publishedOn: {
                type: "string"
            },

            /**
             * The rest. 👇
             */
            modelId: {
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
            state: {
                type: "map"
            }
        }
    });
};
