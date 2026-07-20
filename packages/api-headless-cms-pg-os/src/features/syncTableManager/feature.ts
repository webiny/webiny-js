import { createFeature } from "@webiny/feature/api/index.js";
import { SyncTableManager } from "./SyncTableManager.js";

export const SyncTableManagerFeature = createFeature({
    name: "cms.pgOs.syncTableManager",
    register: container => {
        container.register(SyncTableManager).inSingletonScope();
    }
});
