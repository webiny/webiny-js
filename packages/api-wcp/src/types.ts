import type { Context } from "@webiny/api/types.js";
import type { ILicense, ProjectPackageFeatures } from "@webiny/wcp/types.js";
import type { IWcpContext } from "~/features/WcpContext/index.js";

export interface WcpContext extends Context {
    wcp: IWcpContext;
}

export type WcpContextObject = IWcpContext;

export interface CachedWcpProjectLicense {
    cacheKey: string | null;
    project: WcpProject | null;
    license: ILicense;
}

export interface WcpProject {
    orgId: string;
    projectId: string;
    package: {
        features: ProjectPackageFeatures;
    };
}
