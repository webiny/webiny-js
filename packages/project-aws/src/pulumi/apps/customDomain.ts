import { type Input } from "@pulumi/pulumi";
import type * as aws from "@pulumi/aws";
import { type PulumiAppResource } from "@webiny/pulumi";

/**
 * TLS security policies CloudFront accepts for `minimumProtocolVersion`.
 * Pulumi types the property as a plain string, so the accepted values are
 * listed here to keep the public configuration typed.
 */
export const minimumProtocolVersions = [
    "SSLv3",
    "TLSv1",
    "TLSv1_2016",
    "TLSv1.1_2016",
    "TLSv1.2_2018",
    "TLSv1.2_2019",
    "TLSv1.2_2021"
] as const;

export type MinimumProtocolVersion = (typeof minimumProtocolVersions)[number];

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
