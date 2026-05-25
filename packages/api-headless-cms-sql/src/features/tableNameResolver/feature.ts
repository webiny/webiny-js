import { createFeature } from "@webiny/feature/api/index.js";
import type { ITableNameResolver } from "./abstractions.js";
import { TableNameResolver } from "./abstractions.js";

export const TableNameResolverFeature = (instance: ITableNameResolver) => {
    return createFeature({
        name: "cms.sql.tableNameResolver",
        register: container => {
            container.registerInstance(TableNameResolver, instance);
        }
    });
};
