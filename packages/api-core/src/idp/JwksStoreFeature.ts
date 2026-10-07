import { createFeature } from "@webiny/feature/api";
import { MemoryJwksStore } from "./MemoryJwksStore.js";

/**
 * Register in the ROOT container, so an issuer's keys are fetched once per process instead of on
 * every authenticated request.
 */
export const JwksStoreFeature = createFeature({
    name: "JwksStore",
    register(container) {
        container.register(MemoryJwksStore).inSingletonScope();
    }
});
