import type { Table } from "@webiny/db-dynamodb/toolbox.js";
import { Entity } from "@webiny/db-dynamodb/toolbox.js";
import { createStandardEntity } from "@webiny/db-dynamodb";

interface Params {
    entityName: string;
    table: Table<string, string, string>;
}
export const createTenantEntity = ({ entityName, table }: Params): Entity<any> => {
    return createStandardEntity({ name: entityName, table });
};
