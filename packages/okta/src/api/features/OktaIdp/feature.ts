import { createFeature } from "@webiny/feature/api";
import { OktaIIdentityProvider } from "./OktaIIdentityProvider.js";

export const OktaIdpFeature = createFeature({
    name: "OktaIdp",
    register(container) {
        container.register(OktaIIdentityProvider).inSingletonScope();
    }
});
