import { createFeature } from "@webiny/feature/api";
import { PrivateTaskDefinitions } from "./PrivateTaskDefinitions.js";

export const PrivateTaskDefinitionsFeature = createFeature({
    name: "PrivateTaskDefinitions",
    register(container) {
        container.register(PrivateTaskDefinitions);
    }
});
