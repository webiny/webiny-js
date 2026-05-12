import { SetAdminCustomDomains } from "~/abstractions/features/pulumi/index.js";
import type { AdminPulumiApp } from "~/pulumi/apps/admin/createAdminPulumiApp.js";
import { applyCustomDomain, type CustomDomainParams } from "~/pulumi/apps/customDomain.js";

class DefaultSetAdminCustomDomainsImpl implements SetAdminCustomDomains.Interface {
    apply(app: AdminPulumiApp, params: CustomDomainParams): void {
        applyCustomDomain(app.resources.cloudfront, params);
    }
}

export const DefaultSetAdminCustomDomains = SetAdminCustomDomains.createImplementation({
    implementation: DefaultSetAdminCustomDomainsImpl,
    dependencies: []
});
