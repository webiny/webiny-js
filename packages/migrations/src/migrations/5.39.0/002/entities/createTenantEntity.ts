import { Table } from "@webiny/db-dynamodb/toolbox";
import { createStandardEntity } from "~/utils";

export const createTenantEntity = (table: Table<string, string, string>) => {
    return createStandardEntity(table, "TenancyTenant");
};
