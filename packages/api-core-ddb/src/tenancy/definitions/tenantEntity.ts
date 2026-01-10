import type { Table } from "@webiny/db-dynamodb/toolbox.js";
import { Entity } from "@webiny/db-dynamodb/toolbox.js";
import { createEntity, standardEntityAttributes } from "@webiny/db-dynamodb";
import type { ITenantsEntity, ITenantsEntityAttributes } from "~/tenancy/definitions/types.js";

interface Params {
    entityName: string;
    table: Table<string, string, string>;
}
export const createTenantEntity = ({ entityName, table }: Params): ITenantsEntity => {
    return createEntity<ITenantsEntityAttributes>({
        name: entityName,
        table,
        attributes: {
            ...standardEntityAttributes
        }
    });
};
