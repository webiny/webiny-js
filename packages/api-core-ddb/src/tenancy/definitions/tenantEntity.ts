import type { Table } from "@webiny/db-dynamodb/toolbox.js";
import { createStandardEntity } from "@webiny/db-dynamodb";
import type { ITenantEntity } from "~/tenancy/definitions/types.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";

interface Params {
    entityName: string;
    table: Table<string, string, string>;
}
export const createTenantEntity = ({ entityName, table }: Params): ITenantEntity => {
    return createStandardEntity<Tenant>({
        name: entityName,
        table
    });
};
