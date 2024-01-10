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
