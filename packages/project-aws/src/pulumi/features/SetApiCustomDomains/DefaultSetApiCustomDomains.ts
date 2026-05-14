import type * as aws from "@pulumi/aws";
import type { PulumiAppResource } from "@webiny/pulumi";
import { SetApiCustomDomains } from "~/abstractions/features/pulumi/index.js";
import { applyCustomDomain, type CustomDomainParams } from "~/pulumi/apps/customDomain.js";

class DefaultSetApiCustomDomainsImpl implements SetApiCustomDomains.Interface {
    execute(
        cloudfront: PulumiAppResource<typeof aws.cloudfront.Distribution>,
        params: CustomDomainParams
    ): void {
        applyCustomDomain(cloudfront, params);
    }
}

export const DefaultSetApiCustomDomains = SetApiCustomDomains.createImplementation({
    implementation: DefaultSetApiCustomDomainsImpl,
    dependencies: []
});
