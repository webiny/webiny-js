import { createFeature } from "@webiny/feature/api";
import MaskerImplementation from "./Masker.js";

export const MaskerFeature = createFeature({
    name: "MaskerFeature",
    register(container) {
        container.register(MaskerImplementation);
    }
});
