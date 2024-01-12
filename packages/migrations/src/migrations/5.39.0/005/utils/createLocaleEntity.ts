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
