import { createFeature } from "@webiny/feature/api";
import { WcpContextFeature } from "./WcpContext/feature.js";
import { WcpFeatureFlagsFeature } from "./WcpFeatureFlags/feature.js";
import { WcpContextWithFeatureFlagsDecorator } from "./WcpContext/decorators/WcpContextWithFeatureFlagsDecorator.js";
import type { ILicense } from "@webiny/wcp/types.js";

export const WcpFeature = createFeature({
    name: "WebinyControlPanel",
    register(container, license: ILicense) {
        WcpContextFeature.register(container, license);
        WcpFeatureFlagsFeature.register(container);
        container.registerDecorator(WcpContextWithFeatureFlagsDecorator);
    }
});
