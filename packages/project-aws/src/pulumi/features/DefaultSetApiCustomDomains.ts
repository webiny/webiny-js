import { SetApiCustomDomains } from "~/abstractions/features/pulumi/index.js";
import { applyCustomDomain, type CustomDomainParams } from "~/pulumi/apps/customDomain.js";
import type { ApiPulumiApp } from "~/pulumi/apps/api/createApiPulumiApp.js";

export class DefaultSetApiCustomDomains implements SetApiCustomDomains.Interface {
    constructor(private app: ApiPulumiApp) {}

    execute(params: CustomDomainParams) {
        applyCustomDomain(this.app.resources.cloudfront, params);
    }
}
