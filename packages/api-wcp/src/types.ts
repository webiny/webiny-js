import { Context } from "@webiny/handler/types";
import { DecryptedWcpProjectLicense, WcpProjectEnvironment } from "@webiny/wcp/types";
import { WCP_FEATURES } from "@webiny/wcp";

export interface WcpContext extends Context {
    wcp: WcpContextObject;
}

export interface WcpContextObject {
    getProjectLicense: () => DecryptedWcpProjectLicense | null;
    getProjectEnvironment: () => WcpProjectEnvironment | null;
    canUseFeature: (featureName: keyof typeof WCP_FEATURES) => boolean;
    ensureCanUseFeature: (featureName: keyof typeof WCP_FEATURES) => void;
}

export interface CachedWcpProjectLicense {
    cacheKey: string | null;
    license: DecryptedWcpProjectLicense | null;
}
