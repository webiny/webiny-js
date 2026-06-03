import { createFeature } from "@webiny/feature/api/index.js";
import { EntryTableManager } from "./EntryTableManager.js";

export const EntryTableManagerFeature = createFeature({
    name: "cms.sql.entryTableManager",
    register: container => {
        container.register(EntryTableManager).inSingletonScope();
    }
});
