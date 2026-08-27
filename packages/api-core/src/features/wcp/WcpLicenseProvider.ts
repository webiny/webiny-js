import { createAbstraction } from "@webiny/feature/api";
import type { ILicense } from "@webiny/wcp/types.js";
import { WcpLicenseLoader } from "~/features/wcp/WcpLicenseLoader.js";

export interface IWcpLicenseProvider {
    get(): ILicense;
}

export const WcpLicenseProvider = createAbstraction<IWcpLicenseProvider>("WcpLicenseProvider");

export namespace WcpLicenseProvider {
    export type Interface = IWcpLicenseProvider;
}

/**
 * Synchronous read-through to the process-cached WCP license. `get()` stays sync so the canUse*
 * consumers (WcpContext, IdentityContext, the WCP GraphQL query) do too. The license is refreshed
 * once per request BEFORE any feature registers — `registerApiRequestStack` awaits
 * `WcpLicenseLoader.load()` (process-cached, ~5-min TTL, single-flighted) — so `get()` reflects the
 * live license at both register() time (feature-flag gates) and resolver time.
 *
 * An optional initial license can be supplied (tests pass a pre-resolved one); it seeds the cache.
 */
export class WcpLicenseProviderImpl implements IWcpLicenseProvider {
    constructor(initialLicense?: ILicense) {
        if (initialLicense) {
            WcpLicenseLoader.seed(initialLicense);
        }
    }

    get(): ILicense {
        return WcpLicenseLoader.getCached();
    }
}
