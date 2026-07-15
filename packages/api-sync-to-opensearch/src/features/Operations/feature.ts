import { createFeature } from "@webiny/feature/api";
import { OperationsFactoryImplementation } from "./factory.js";

export const OperationsFactoryFeature = createFeature({
    name: "sync.operationsFactory",
    register(container) {
        container.register(OperationsFactoryImplementation);
    }
});
