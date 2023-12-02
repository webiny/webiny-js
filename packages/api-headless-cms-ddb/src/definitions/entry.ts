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
            revisionCreatedBy: { type: "map" },
            revisionSavedBy: { type: "map" },
            revisionModifiedBy: { type: "map" },

            /**
             * Entry-level meta fields. 👇
             */
            entryCreatedOn: { type: "string" },
            entrySavedOn: { type: "string" },
            entryModifiedOn: { type: "string" },
            entryCreatedBy: { type: "map" },
            entrySavedBy: { type: "map" },
            entryModifiedBy: { type: "map" },

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
