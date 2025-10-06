import type { WCP_FEATURE_LABEL } from "@webiny/wcp";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types";

// features/Wcp/types.ts
export type WcpProjectData = DecryptedWcpProjectLicense;

export type WcpFeatureName = keyof typeof WCP_FEATURE_LABEL;

export interface GetWcpProjectResponse {
    wcp: {
        getProject: {
            data: WcpProjectData | null;
            error: {
                message: string;
                code: string;
                data: any;
            } | null;
        };
    };
}

export interface AaclPermission {
    name: "aacl";
    legacy: boolean;
    teams: boolean;
}
