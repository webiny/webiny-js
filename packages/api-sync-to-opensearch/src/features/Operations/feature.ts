import { createFeature } from "@webiny/feature/api";
import { OperationsFactory } from "./OperationsFactory.js";

export const OperationsFactoryFeature = createFeature({
    name: "sync.operationsFactory",
    register(container) {
        container.register(OperationsFactory);
    }
});
