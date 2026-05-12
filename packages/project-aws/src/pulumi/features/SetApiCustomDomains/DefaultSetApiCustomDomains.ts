import { SetApiCustomDomains } from "~/abstractions/features/pulumi/index.js";
import type { ApiPulumiApp } from "~/pulumi/apps/api/createApiPulumiApp.js";
import { applyCustomDomain, type CustomDomainParams } from "~/pulumi/apps/customDomain.js";
import { ApiCloudfront } from "~/pulumi/apps/api/ApiCloudfront.js";

class DefaultSetApiCustomDomainsImpl implements SetApiCustomDomains.Interface {
    apply(app: ApiPulumiApp, params: CustomDomainParams): void {
        applyCustomDomain(app.getModule(ApiCloudfront), params);
    }
}

export const DefaultSetApiCustomDomains = SetApiCustomDomains.createImplementation({
    implementation: DefaultSetApiCustomDomainsImpl,
    dependencies: []
});
