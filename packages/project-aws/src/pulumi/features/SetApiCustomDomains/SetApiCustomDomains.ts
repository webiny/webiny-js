import { SetApiCustomDomains } from "~/abstractions/features/pulumi/index.js";
import { applyCustomDomain, type CustomDomainParams } from "~/pulumi/apps/customDomain.js";
import type { ApiPulumiApp } from "~/pulumi/apps/api/createApiPulumiApp.js";

export class DefaultSetApiCustomDomains implements SetApiCustomDomains.Interface {
    execute(app: ApiPulumiApp, params: CustomDomainParams) {
        applyCustomDomain(app.resources.cloudfront, params);
    }
}

export const setApiCustomDomains = SetApiCustomDomains.createImplementation({
    implementation: DefaultSetApiCustomDomains,
    dependencies: []
});
