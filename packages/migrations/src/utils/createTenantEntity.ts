import type { Table, Entity } from "@webiny/db-dynamodb/toolbox.js";
import { createStandardEntity } from "~/utils/index.js";

export const createTenantEntity = (table: Table<string, string, string>): Entity => {
    return createStandardEntity(table, "TenancyTenant");
};
