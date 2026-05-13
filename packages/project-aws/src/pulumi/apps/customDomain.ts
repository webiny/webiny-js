import { type Input } from "@pulumi/pulumi";
import type * as aws from "@pulumi/aws";
import { type PulumiAppResource } from "@webiny/pulumi";

export interface CustomDomainParams {
    domains: Input<string[]>;
    certificateArn: Input<string>;
    sslMethod?: Input<string>;
}

export function applyCustomDomain(
    cloudfront: PulumiAppResource<typeof aws.cloudfront.Distribution>,
    params: CustomDomainParams
) {
    cloudfront.config.aliases(params.domains);

    cloudfront.config.viewerCertificate({
        acmCertificateArn: params.certificateArn,
        sslSupportMethod: params.sslMethod ?? "sni-only"
    });
}
