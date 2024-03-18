import { Entity, Table } from "@webiny/db-dynamodb/toolbox";
import { Attributes } from "~/types";

export interface CreateEntryEntityParams {
    table: Table<string, string, string>;
    entityName: string;
    attributes: Attributes;
}
export const createEntryEntity = (params: CreateEntryEntityParams): Entity<any> => {
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

            /**
             * Revision-level meta fields. 👇
             */
            revisionCreatedOn: { type: "string" },
            revisionSavedOn: { type: "string" },
            revisionModifiedOn: { type: "string" },
            revisionDeletedOn: { type: "string" },
            revisionFirstPublishedOn: { type: "string" },
            revisionLastPublishedOn: { type: "string" },
            revisionCreatedBy: { type: "map" },
            revisionSavedBy: { type: "map" },
            revisionModifiedBy: { type: "map" },
            revisionDeletedBy: { type: "map" },
            revisionFirstPublishedBy: { type: "map" },
            revisionLastPublishedBy: { type: "map" },

            /**
             * Entry-level meta fields. 👇
             */
            createdOn: { type: "string" },
            savedOn: { type: "string" },
            modifiedOn: { type: "string" },
            deletedOn: { type: "string" },
            firstPublishedOn: { type: "string" },
            lastPublishedOn: { type: "string" },
            createdBy: { type: "map" },
            savedBy: { type: "map" },
            modifiedBy: { type: "map" },
            deletedBy: { type: "map" },
            firstPublishedBy: { type: "map" },
            lastPublishedBy: { type: "map" },

            modelId: {
                type: "string"
            },
            locale: {
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
            deleted: {
                type: "boolean"
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
