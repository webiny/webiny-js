import { Context } from "@webiny/handler/types";
import { DecryptedWcpProjectLicense, WcpProjectEnvironment } from "@webiny/wcp/types";
import { WCP_FEATURE_LABEL } from "@webiny/wcp";
import { SecurityContext } from "@webiny/api-security/types";
import { TenancyContext } from "@webiny/api-tenancy/types";

export interface WcpContext extends Context, SecurityContext, TenancyContext {
    wcp: WcpContextObject;
}

export interface WcpContextObject {
    getProjectLicense: () => DecryptedWcpProjectLicense | null;
    getProjectEnvironment: () => WcpProjectEnvironment | null;
    canUseFeature: (featureId: keyof typeof WCP_FEATURE_LABEL) => boolean;
    ensureCanUseFeature: (featureId: keyof typeof WCP_FEATURE_LABEL) => void;
    incrementSeats: () => Promise<void>;
    decrementSeats: () => Promise<void>;
}

export interface CachedWcpProjectLicense {
    cacheKey: string | null;
    license: DecryptedWcpProjectLicense | null;
}
