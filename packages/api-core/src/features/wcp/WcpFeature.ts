import { createFeature } from "@webiny/feature/api";
import { WcpContextFeature } from "./WcpContext/feature.js";
import { WcpContextWithFeatureFlagsDecorator } from "./WcpContext/decorators/WcpContextWithFeatureFlagsDecorator.js";
import { WcpLicenseProvider, WcpLicenseProviderImpl } from "./WcpLicenseProvider.js";
import type { ILicense } from "@webiny/wcp/types.js";

export const WcpFeature = createFeature<ILicense | undefined>({
    name: "WebinyControlPanel",
    register(container, initialLicense?) {
        const provider = new WcpLicenseProviderImpl(initialLicense);
        container.registerInstance(WcpLicenseProvider, provider);
        WcpContextFeature.register(container, provider);
        container.registerDecorator(WcpContextWithFeatureFlagsDecorator);
        // Per-request license refresh (RequestInitializer) is registered by api-event-handler-core's
        // registerApiRequestStack, keeping the domain layer free of the transport lifecycle contract.
    }
});
