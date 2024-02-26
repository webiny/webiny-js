import { Context } from "@webiny/api/types";
import { DecryptedWcpProjectLicense, WcpProjectEnvironment } from "@webiny/wcp/types";
import { WCP_FEATURE_LABEL } from "@webiny/wcp";

export interface WcpContext extends Context {
    wcp: WcpContextObject;
}

export interface WcpContextObject {
    getProjectLicense: () => DecryptedWcpProjectLicense | null;
    getProjectEnvironment: () => WcpProjectEnvironment | null;
    canUseFeature: (featureId: keyof typeof WCP_FEATURE_LABEL) => boolean;
    canUseAacl: () => boolean;
    canUseTeams: () => boolean;
    canUsePrivateFiles: () => boolean;
    canUseFolderLevelPermissions: () => boolean;
    ensureCanUseFeature: (featureId: keyof typeof WCP_FEATURE_LABEL) => void;
    incrementSeats: () => Promise<void>;
    decrementSeats: () => Promise<void>;
    incrementTenants: () => Promise<void>;
    decrementTenants: () => Promise<void>;
}

export interface CachedWcpProjectLicense {
    cacheKey: string | null;
    license: DecryptedWcpProjectLicense | null;
}

export type AaclPermission = {
    name: "aacl";
    legacy: boolean;
    teams: boolean;
};
