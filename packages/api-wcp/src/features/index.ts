import { createFeature } from "@webiny/feature/api";
import { GetProject } from "~/features/GetProject/feature.js";
import { WcpContextFeature } from "~/features/WcpContext/feature.js";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types.js";

export interface WcpFeaturesParams {
    testProjectLicense?: DecryptedWcpProjectLicense;
}

export const WcpFeatures = createFeature({
    name: "Wcp",
    register(container, options?: WcpFeaturesParams) {
        GetProject.register(container);
        WcpContextFeature.register(container, { testProjectLicense: options?.testProjectLicense });
    }
});
