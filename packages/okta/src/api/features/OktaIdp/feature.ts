import { createFeature } from "@webiny/feature/api";
import { OktaIdpProviderFactory } from "./OktaIdpProviderFactory.js";

export const OktaIdpFeature = createFeature({
    name: "OktaIdp",
    register(container) {
        container.register(OktaIdpProviderFactory).inSingletonScope();
    }
});
