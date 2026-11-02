import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
import { WorkflowsAdminUrlService as Abstraction } from "./abstractions.js";

class WorkflowsAdminUrlServiceImpl implements Abstraction.Interface {
    public async get(): Promise<string | null> {
        try {
            // The same manifest key `NextjsConfig.getDomains` reads; `domain` is a bare host.
            const manifest = await ServiceDiscovery.load();
            const domain: unknown = manifest?.admin?.cloudfront?.domain;
            if (typeof domain !== "string") {
                return null;
            }
            const host = domain.trim().replace(/\/+$/, "");
            return host === "" ? null : `https://${host}`;
        } catch {
            // A missing loader throws. No link is not an error, and the link service logs the
            // problems that matter (R195).
            return null;
        }
    }
}

export const WorkflowsAdminUrlService = Abstraction.createImplementation({
    implementation: WorkflowsAdminUrlServiceImpl,
    dependencies: []
});
