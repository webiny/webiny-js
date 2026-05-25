import { createFeature } from "@webiny/feature/api/index.js";
import { EntrySchemaManager } from "./EntrySchemaManager.js";

export const EntrySchemaManagerFeature = createFeature({
    name: "cms.sql.entrySchemaManager",
    register: container => {
        container.register(EntrySchemaManager).inSingletonScope();
    }
});
