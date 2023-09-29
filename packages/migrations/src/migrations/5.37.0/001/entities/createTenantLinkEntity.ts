import { Table } from "dynamodb-toolbox";
import { createStandardEntity } from "~/utils";

export const createTenantLinkEntity = (table: Table<string, string, string>) => {
    return createStandardEntity(table, "SecurityIdentity2Tenant", { type: { type: "string" } });
};
