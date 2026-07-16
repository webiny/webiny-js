import { createFeature } from "@webiny/feature/api";
import { DdbOperationsBuilder } from "./DdbOperationsBuilder.js";

export const DdbOperationsBuilderFeature = createFeature({
    name: "sync.ddb.operationsBuilder",
    register(container) {
        container.register(DdbOperationsBuilder);
    }
});
