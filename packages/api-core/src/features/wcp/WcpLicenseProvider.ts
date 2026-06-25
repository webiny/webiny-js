import { createAbstraction } from "@webiny/feature/api";
import { NullLicense } from "@webiny/wcp";
import type { ILicense } from "@webiny/wcp/types.js";

export interface IWcpLicenseProvider {
    get(): ILicense;
}

export const WcpLicenseProvider = createAbstraction<IWcpLicenseProvider>("WcpLicenseProvider");

export namespace WcpLicenseProvider {
    export type Interface = IWcpLicenseProvider;
}

/**
 * Holds either a concrete license (tests) or a Promise<ILicense> (production).
 * When given a Promise, starts with NullLicense and swaps in the real license once resolved.
 *
 * TODO: two related problems, both stemming from loading the license once at construction time.
 *
 * 1. NullLicense race. `get()` returns the NullLicense placeholder until the load promise
 *    resolves. In production `loadWcpLicense()` performs a network fetch to the WCP API, so
 *    there is a window where a resolver calling `get()` receives NullLicense and feature checks
 *    (canUseTeams, canUseAacl, ...) fail closed.
 *
 * 2. The license never refreshes. WcpFeature.register runs in the handler's `root` scope, which
 *    executes ONCE per cold start (not per request). So `loadWcpLicense()` is called exactly
 *    once per warm Lambda instance and this provider holds that license for the instance's whole
 *    lifetime. `loadWcpLicense()` has a 5-minute cache-key rotation (getWcpProjectLicenseCacheKey)
 *    designed to refetch the license every 5 minutes — but since we never call it again, that
 *    refresh never happens. A license change (upgrade/downgrade/expiry) won't take effect until
 *    the next cold start.
 *
 * Fix (both at once): add an async `refresh()` that calls `loadWcpLicense()` and updates the
 * current license, and invoke it once per request BEFORE resolvers run (a request-scoped step /
 * before-handler hook), awaiting it. Keep `get()` synchronous so the canUse* consumers
 * (IdentityContext, GroupsTeamsAuthorizer, the WCP GraphQL query) stay sync. The process-global
 * cache in loadWcpLicense throttles the actual network calls (cheap within a 5-min block,
 * refetch once when it rolls over). The per-request await also closes the race in (1).
 *
 * Do NOT "load once at init" — that cements problem (2).
 */
export class WcpLicenseProviderImpl implements IWcpLicenseProvider {
    private current: ILicense;

    constructor(licenseOrPromise: ILicense | Promise<ILicense>) {
        if (licenseOrPromise instanceof Promise) {
            this.current = new NullLicense();
            licenseOrPromise.then(l => {
                this.current = l;
            });
        } else {
            this.current = licenseOrPromise;
        }
    }

    get(): ILicense {
        return this.current;
    }
}
