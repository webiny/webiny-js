import { Table } from "dynamodb-toolbox";
import { createStandardEntity } from "~/utils";

export const createTenantLinkEntity = (table: Table) => {
    return createStandardEntity(table, "SecurityIdentity2Tenant");
};
