import type { Table } from "@webiny/db-dynamodb/toolbox.js";
import { createEntity, standardEntityAttributes } from "@webiny/db-dynamodb";
import type { ITenantEntity, ITenantEntityAttributes } from "~/tenancy/definitions/types.js";

interface Params {
    entityName: string;
    table: Table<string, string, string>;
}
export const createTenantEntity = ({ entityName, table }: Params): ITenantEntity => {
    return createEntity<ITenantEntityAttributes>({
        name: entityName,
        table,
        attributes: {
            ...standardEntityAttributes
        }
    });
};
