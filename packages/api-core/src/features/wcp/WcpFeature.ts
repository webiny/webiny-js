import { createFeature } from "@webiny/feature/api";
import { WcpContextFeature } from "./WcpContext/feature.js";
import { WcpContextWithFeatureFlagsDecorator } from "./WcpContext/decorators/WcpContextWithFeatureFlagsDecorator.js";
import { WcpLicenseProviderImpl } from "./WcpLicenseProvider.js";
import { loadWcpLicense } from "~/features/wcp/loadWcpLicense.js";
import type { ILicense } from "@webiny/wcp/types.js";

export const WcpFeature = createFeature<ILicense | undefined>({
    name: "WebinyControlPanel",
    register(container, testLicense?) {
        const provider = new WcpLicenseProviderImpl(testLicense ?? loadWcpLicense());
        WcpContextFeature.register(container, provider);
        container.registerDecorator(WcpContextWithFeatureFlagsDecorator);
    }
});
