import { createFeature } from "@webiny/feature/api";
import { WcpContextFeature } from "./WcpContext/feature.js";
import { WcpContextWithFeatureFlagsDecorator } from "./WcpContext/decorators/WcpContextWithFeatureFlagsDecorator.js";
import { WcpLicenseProvider, WcpLicenseProviderImpl } from "./WcpLicenseProvider.js";
import { WcpLicenseInitializer } from "./WcpLicenseInitializer.js";
import type { ILicense } from "@webiny/wcp/types.js";

export const WcpFeature = createFeature<ILicense | undefined>({
    name: "WebinyControlPanel",
    register(container, initialLicense?) {
        const provider = new WcpLicenseProviderImpl(initialLicense);
        container.registerInstance(WcpLicenseProvider, provider);
        WcpContextFeature.register(container, provider);
        container.registerDecorator(WcpContextWithFeatureFlagsDecorator);
        // Refresh the license once per request (before resolvers) via the RequestInitializer hook.
        container.register(WcpLicenseInitializer);
    }
});
