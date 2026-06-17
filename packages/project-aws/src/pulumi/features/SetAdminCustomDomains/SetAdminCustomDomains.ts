import { SetAdminCustomDomains } from "~/abstractions/features/pulumi/index.js";
import { applyCustomDomain, type CustomDomainParams } from "~/pulumi/apps/customDomain.js";
import type { AdminPulumiApp } from "~/pulumi/apps/admin/createAdminPulumiApp.js";

export class DefaultSetAdminCustomDomains implements SetAdminCustomDomains.Interface {
    execute(app: AdminPulumiApp, params: CustomDomainParams) {
        applyCustomDomain(app.resources.cloudfront, params);
    }
}

export const setAdminCustomDomains = SetAdminCustomDomains.createImplementation({
    implementation: DefaultSetAdminCustomDomains,
    dependencies: []
});
