import type * as aws from "@pulumi/aws";
import type { PulumiAppResource } from "@webiny/pulumi";
import { SetAdminCustomDomains } from "~/abstractions/features/pulumi/index.js";
import { applyCustomDomain, type CustomDomainParams } from "~/pulumi/apps/customDomain.js";

class DefaultSetAdminCustomDomainsImpl implements SetAdminCustomDomains.Interface {
    execute(
        cloudfront: PulumiAppResource<typeof aws.cloudfront.Distribution>,
        params: CustomDomainParams
    ): void {
        applyCustomDomain(cloudfront, params);
    }
}

export const DefaultSetAdminCustomDomains = SetAdminCustomDomains.createImplementation({
    implementation: DefaultSetAdminCustomDomainsImpl,
    dependencies: []
});
