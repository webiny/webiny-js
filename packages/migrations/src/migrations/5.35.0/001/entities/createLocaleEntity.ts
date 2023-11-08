import { Table } from "@webiny/db-dynamodb/toolbox";
import { createLegacyEntity } from "~/utils";

export const createLocaleEntity = (table: Table<string, string, string>) => {
    return createLegacyEntity(table, "I18NLocale", {
        createdOn: {
            type: "string"
        },
        createdBy: {
            type: "map"
        },
        code: {
            type: "string"
        },
        default: {
            type: "boolean"
        },
        webinyVersion: {
            type: "string"
        },
        tenant: {
            type: "string"
        }
    });
};

// [
//     {
//         PK: "T#root#I18N#L",
//         SK: "en-US",
//         code: "en-US",
//         createdBy: {
//             displayName: "Pavel Denisjuk",
//             id: "e6ea2871-ba36-4494-87ac-afb73d4e7eb2",
//             type: "admin"
//         },
//         createdOn: "2023-01-25T09:38:22.029Z",
//         default: true,
//         tenant: "root",
//         webinyVersion: "0.0.0",
//         _ct: "2023-01-25T09:38:22.041Z",
//         _et: "I18NLocale",
//         _md: "2023-01-25T09:38:22.041Z"
//     }
// ];
