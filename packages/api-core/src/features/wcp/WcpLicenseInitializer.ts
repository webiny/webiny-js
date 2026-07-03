import { RequestInitializer } from "@webiny/event-handler-core";
import { WcpLicenseProvider } from "./WcpLicenseProvider.js";
import type { IWcpLicenseProvider } from "./WcpLicenseProvider.js";

/**
 * Per-request hook that refreshes the WCP license before the request is dispatched (and before any
 * synchronous canUse* check runs). The license is project-level / tenant-agnostic, so this runs
 * fine ahead of auth/tenant. See WcpLicenseProvider for why this is per-request rather than once.
 */
class WcpLicenseInitializerImpl implements RequestInitializer.Interface {
    constructor(private provider: IWcpLicenseProvider) {}

    async init(): Promise<void> {
        await this.provider.refresh();
    }
}

export const WcpLicenseInitializer = RequestInitializer.createImplementation({
    implementation: WcpLicenseInitializerImpl,
    dependencies: [WcpLicenseProvider]
});
