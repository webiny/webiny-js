import { createFeature } from "@webiny/feature/api";
import { NamespaceHandlerExecutioner } from "./NamespaceHandlerExecutioner.js";
const NamespaceHandlerExecutionerFeature = createFeature({
    name: "NamespaceHandlerExecutioner",
    register (container) {
        container.register(NamespaceHandlerExecutioner);
    }
});
export { NamespaceHandlerExecutionerFeature };

//# sourceMappingURL=feature.js.map