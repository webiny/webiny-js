import { Table } from "dynamodb-toolbox";
import { createLegacyEntity } from "~/utils";

export const createLocaleEntity = (table: Table) => {
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
