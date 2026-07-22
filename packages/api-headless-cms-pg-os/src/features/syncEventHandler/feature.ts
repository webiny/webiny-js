import { createFeature } from "@webiny/feature/api/index.js";
import { SyncEventHandler } from "./SyncEventHandler.js";

export const SyncEventHandlerFeature = createFeature({
    name: "cms.pgOs.syncEventHandler",
    register: container => {
        container.register(SyncEventHandler);
    }
});
