import { Context } from "@webiny/handler/types";
import { DecryptedWcpProjectLicense, WcpProjectEnvironment } from "@webiny/wcp/types";
import { WCP_FEATURE_LABEL } from "@webiny/wcp";

export interface WcpContext extends Context {
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

export type WcpPermission = {
    name: 'wcp',

    // If boolean, tells us whether the project has access to the Advanced Access Control Layer (AACL)
    // feature, based on the project's WCP license. `null` means we're dealing with an old, non-WCP,
    // project, meaning access should be allowed, even without a valid WCP license.
    aacl: boolean | null
}
