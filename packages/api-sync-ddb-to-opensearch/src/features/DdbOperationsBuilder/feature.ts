import { createFeature } from "@webiny/feature/api";
import { DdbOperationsBuilderImplementation } from "./DdbOperationsBuilder.js";

export const DdbOperationsBuilderFeature = createFeature({
    name: "sync.ddb.operationsBuilder",
    register(container) {
        container.register(DdbOperationsBuilderImplementation);
    }
});
