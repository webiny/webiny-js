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

// [
//     {
//         PK: "T#root",
//         SK: "A",
//         createdOn: "2023-01-25T09:37:58.183Z",
//         description: "The top-level Webiny tenant.",
//         GSI1_PK: "TENANTS",
//         GSI1_SK: "T#null#2023-01-25T09:37:58.183Z",
//         id: "root",
//         name: "Root",
//         savedOn: "2023-01-25T09:37:58.183Z",
//         settings: {
//             domains: []
//         },
//         status: "active",
//         TYPE: "tenancy.tenant",
//         webinyVersion: "0.0.0",
//         _ct: "2023-01-25T09:37:58.220Z",
//         _et: "TenancyTenant",
//         _md: "2023-01-25T09:37:58.220Z"
//     }
// ];
