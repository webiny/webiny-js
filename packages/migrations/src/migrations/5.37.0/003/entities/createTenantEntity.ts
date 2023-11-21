import { Table } from "dynamodb-toolbox";
import { createStandardEntity } from "~/utils";

export const createTenantEntity = (table: Table) => {
    return createStandardEntity(table, "TenancyTenant");
};
