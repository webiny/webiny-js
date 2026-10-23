import { createFeature } from "@webiny/feature/api";
import { Hasher } from "./ScryptHasher.js";
import { BuildParamsHashingConfig } from "./BuildParamsHashingConfig.js";

export const HasherFeature = createFeature({
    name: "HasherFeature",
    register(container) {
        container.register(BuildParamsHashingConfig);
        container.register(Hasher);
    }
});
