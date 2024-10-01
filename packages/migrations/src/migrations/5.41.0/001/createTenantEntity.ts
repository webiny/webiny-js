import { Table } from "@webiny/db-dynamodb/toolbox";
import { createLegacyEntity } from "~/utils";

export const createTenantEntity = (table: Table<string, string, string>) => {
    return createLegacyEntity(table, "TenancyTenant", {
        id: {
            type: "string"
        },
        name: {
            type: "string"
        },
        description: {
            type: "string"
        },
        status: {
            type: "string",
            default: "active"
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
        parent: {
            type: "string"
        },
        webinyVersion: {
            type: "string"
        },
        settings: {
            type: "map",
            default: {}
        }
    });
};
