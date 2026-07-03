import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { WcpContextImpl } from "./WcpContext.js";
import { WcpContext } from "./abstractions.js";
import type { WcpLicenseProvider } from "../WcpLicenseProvider.js";

export const WcpContextFeature = createFeature({
    name: "WcpContext",
    register(container: Container, provider: WcpLicenseProvider.Interface) {
        container.registerInstance(WcpContext, new WcpContextImpl(provider));
    }
});
