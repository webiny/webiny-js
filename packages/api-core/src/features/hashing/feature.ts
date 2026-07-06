import { createFeature } from "@webiny/feature/api";
import { Hasher } from "./ScryptHasher.js";

export const HasherFeature = createFeature({
    name: "HasherFeature",
    register(container) {
        container.register(Hasher);
    }
});
