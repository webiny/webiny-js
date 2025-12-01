import type { Table } from "@webiny/db-dynamodb/toolbox.js";
import { createLegacyEntity } from "~/utils/index.js";

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
        tenant: {
            type: "string"
        }
    });
};
