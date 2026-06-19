import { createFeature } from "@webiny/feature/api";
import { NamespaceHandlerExecutioner } from "./NamespaceHandlerExecutioner.js";

export const NamespaceHandlerExecutionerFeature = createFeature({
    name: "NamespaceHandlerExecutioner",
    register(container) {
        container.register(NamespaceHandlerExecutioner);
    }
});
