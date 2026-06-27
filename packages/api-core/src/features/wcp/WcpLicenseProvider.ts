import { createAbstraction } from "@webiny/feature/api";
import { NullLicense } from "@webiny/wcp";
import type { ILicense } from "@webiny/wcp/types.js";
import { loadWcpLicense } from "~/features/wcp/loadWcpLicense.js";

export interface IWcpLicenseProvider {
    get(): ILicense;
    refresh(): Promise<void>;
}

export const WcpLicenseProvider = createAbstraction<IWcpLicenseProvider>("WcpLicenseProvider");

export namespace WcpLicenseProvider {
    export type Interface = IWcpLicenseProvider;
}

/**
 * Holds the current WCP license. `get()` is synchronous so the canUse* consumers (IdentityContext,
 * GroupsTeamsAuthorizer, the WCP GraphQL query) stay sync. `refresh()` is driven once per request
 * by WcpLicenseInitializer (a RequestInitializer), BEFORE resolvers run:
 *
 * - It re-reads `loadWcpLicense()`, whose process-global cache rotates ~every 5 minutes, so a
 *   license change (upgrade/downgrade/expiry) takes effect mid-Lambda-lifetime instead of only on
 *   the next cold start.
 * - Awaiting it per request before resolvers closes the NullLicense race (no window where a
 *   resolver sees the placeholder).
 *
 * An optional initial license can be supplied (tests pass the pre-resolved license); otherwise it
 * starts as NullLicense and the first refresh() (before resolvers) installs the real one.
 */
export class WcpLicenseProviderImpl implements IWcpLicenseProvider {
    private current: ILicense;

    constructor(initialLicense?: ILicense) {
        this.current = initialLicense ?? new NullLicense();
    }

    get(): ILicense {
        return this.current;
    }

    async refresh(): Promise<void> {
        this.current = await loadWcpLicense();
    }
}
