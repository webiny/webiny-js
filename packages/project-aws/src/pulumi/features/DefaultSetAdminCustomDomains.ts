import { SetAdminCustomDomains } from "~/abstractions/features/pulumi/index.js";
import { applyCustomDomain, type CustomDomainParams } from "~/pulumi/apps/customDomain.js";
import type { AdminPulumiApp } from "~/pulumi/apps/admin/createAdminPulumiApp.js";

export class DefaultSetAdminCustomDomains implements SetAdminCustomDomains.Interface {
    constructor(private app: AdminPulumiApp) {}

    execute(params: CustomDomainParams) {
        applyCustomDomain(this.app.resources.cloudfront, params);
    }
}
