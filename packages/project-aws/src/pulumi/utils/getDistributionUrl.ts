import * as pulumi from "@pulumi/pulumi";
import type * as aws from "@pulumi/aws";
import type { PulumiAppResource } from "@webiny/pulumi";

/**
 * The URL a CloudFront distribution is reached on: its first custom domain (alias) if it has one,
 * otherwise the default CloudFront domain. Same rule as the `usedUrl` stack output in
 * `addDomainsUrlsOutputs`.
 */
export const getDistributionUrl = (
    distribution: PulumiAppResource<typeof aws.cloudfront.Distribution>
): pulumi.Output<string> => {
    return pulumi
        .all([distribution.output.aliases, distribution.output.domainName])
        .apply(([aliases, domainName]) => `https://${aliases?.[0] || domainName}`);
};
