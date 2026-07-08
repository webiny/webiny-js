import { RequestInitializer } from "@webiny/event-handler-core";
import { WcpLicenseProvider } from "@webiny/api-core";
import type { IWcpLicenseProvider } from "@webiny/api-core";

/**
 * Per-request hook that refreshes the WCP license before the request is dispatched (and before any
 * synchronous canUse* check runs). The license is project-level / tenant-agnostic, so this runs fine
 * ahead of auth/tenant.
 *
 * Lives in api-event-handler-core (the shared API request stack) rather than api-core so the domain
 * layer stays free of the transport request-lifecycle contract, while the refresh still runs for
 * every flavour (aws + server) via registerApiRequestStack.
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
