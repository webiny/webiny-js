import { createFeature } from "@webiny/feature/api/index.js";
import { SqlEntryOperations } from "./SqlEntryOperations.js";

export const SqlEntryOperationsFeature = createFeature({
    name: "cms.sql.entryOperations",
    register: container => {
        container.register(SqlEntryOperations);
    }
});
