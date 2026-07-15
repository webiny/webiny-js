import { createFeature } from "@webiny/feature/api";
import { DdbToOpenSearchHandler } from "./DdbToOpenSearchHandler.js";

export const DdbToOpenSearchHandlerFeature = createFeature({
    name: "sync.ddb.handler",
    register(container) {
        container.register(DdbToOpenSearchHandler);
    }
});
