import { createFeature } from "@webiny/feature/api";
import { DdbOperationsBuilderImplementation } from "./implementation.js";

export const DdbOperationsBuilderFeature = createFeature({
    name: "sync.ddb.operationsBuilder",
    register(container) {
        container.register(DdbOperationsBuilderImplementation);
    }
});
