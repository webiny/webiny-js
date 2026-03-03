import { createAbstraction } from "@webiny/feature/api";
import type { ILicense, WcpProject, WcpProjectEnvironment } from "@webiny/wcp/types.js";
import type { WCP_FEATURE_LABEL } from "@webiny/wcp";

/**
 * WcpContext Abstraction
 */
export interface IWcpContext extends ILicense {
    getProject(): WcpProject | null;
    getProjectWithFeatureFlags(): WcpProject | null;
    getProjectLicense(): ILicense;
    getProjectEnvironment(): WcpProjectEnvironment | null;
    ensureCanUseFeature(featureId: keyof typeof WCP_FEATURE_LABEL): void;
    incrementSeats(): Promise<void>;
    decrementSeats(): Promise<void>;
    incrementTenants(): Promise<void>;
    decrementTenants(): Promise<void>;
}

export const WcpContext = createAbstraction<IWcpContext>("WcpContext");

export namespace WcpContext {
    export type Interface = IWcpContext;
}
