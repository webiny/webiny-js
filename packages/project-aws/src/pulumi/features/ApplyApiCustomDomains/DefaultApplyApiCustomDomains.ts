import { ApplyApiCustomDomains } from "~/abstractions/features/pulumi/index.js";
import type { ApiPulumiApp } from "~/pulumi/apps/api/createApiPulumiApp.js";
import { applyCustomDomain, type CustomDomainParams } from "~/pulumi/apps/customDomain.js";
import { ApiCloudfront } from "~/pulumi/apps/api/ApiCloudfront.js";

class DefaultApplyApiCustomDomainsImpl implements ApplyApiCustomDomains.Interface {
    apply(app: ApiPulumiApp, params: CustomDomainParams): void {
        applyCustomDomain(app.getModule(ApiCloudfront), params);
    }
}

export const DefaultApplyApiCustomDomains = ApplyApiCustomDomains.createImplementation({
    implementation: DefaultApplyApiCustomDomainsImpl,
    dependencies: []
});
