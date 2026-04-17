import { createFeature } from "@webiny/feature/api";
import { WcpContextFeature } from "./WcpContext/feature.js";
import { WcpContextWithFeatureFlagsDecorator } from "./WcpContext/decorators/WcpContextWithFeatureFlagsDecorator.js";
import type { ILicense } from "@webiny/wcp/types.js";

export const WcpFeature = createFeature<ILicense>({
    name: "WebinyControlPanel",
    register(container, license) {
        WcpContextFeature.register(container, license);
        container.registerDecorator(WcpContextWithFeatureFlagsDecorator);
    }
});
