import { type Input } from "@pulumi/pulumi";
import type * as aws from "@pulumi/aws";
import { type PulumiAppResource } from "@webiny/pulumi";
import { type MinimumProtocolVersion } from "@webiny/project-extensions-aws/extensions/minimumProtocolVersions.js";

export {
    minimumProtocolVersions,
    type MinimumProtocolVersion
} from "@webiny/project-extensions-aws/extensions/minimumProtocolVersions.js";

export interface CustomDomainParams {
    domains: Input<string[]>;
    acmCertificateArn: Input<string>;
    sslSupportMethod?: Input<string>;
    /**
     * Minimum TLS version viewers must support in order to connect.
     *
     * Left unset by default, which keeps whatever CloudFront applies on its
     * own. Setting it on an existing project updates the distribution, and
     * raising it can lock out clients that only speak older TLS versions.
     */
    minimumProtocolVersion?: Input<MinimumProtocolVersion>;
}

export function applyCustomDomain(
    cloudfront: PulumiAppResource<typeof aws.cloudfront.Distribution>,
    params: CustomDomainParams
) {
    cloudfront.config.aliases(params.domains);

    cloudfront.config.viewerCertificate({
        acmCertificateArn: params.acmCertificateArn,
        sslSupportMethod: params.sslSupportMethod ?? "sni-only",
        // Only sent when configured, so distributions that do not set it are
        // left exactly as they were.
        ...(params.minimumProtocolVersion
            ? { minimumProtocolVersion: params.minimumProtocolVersion }
            : {})
    });
}
