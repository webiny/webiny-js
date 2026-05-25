import { createFeature } from "@webiny/feature/api/index.js";
import { TableNameResolver } from "./TableNameResolver.js";

export const TableNameResolverFeature = createFeature({
    name: "cms.sql.tableNameResolver",
    register: container => {
        container.register(TableNameResolver).inSingletonScope();
    }
});
