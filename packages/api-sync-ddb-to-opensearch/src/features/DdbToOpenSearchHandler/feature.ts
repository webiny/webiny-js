import { createFeature } from "@webiny/feature/api";
import { DdbToOpenSearchHandler } from "./implementation.js";

export const DdbToOpenSearchHandlerFeature = createFeature({
    name: "sync.ddb.handler",
    register(container) {
        container.register(DdbToOpenSearchHandler);
    }
});
