import { createFeature } from "@webiny/feature/api";
import { WcpContextFeature } from "~/features/WcpContext/feature.js";
import type { ILicense } from "@webiny/wcp/types.js";

export const WcpFeatures = createFeature({
    name: "WebinyControlPanel",
    register(container, license: ILicense) {
        WcpContextFeature.register(container, license);
    }
});
