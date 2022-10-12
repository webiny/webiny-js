import { Input } from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { PulumiAppResource } from "@webiny/pulumi";

export interface CustomDomainParams {
    domains: Input<string[]>;
    acmCertificateArn: Input<string>;
    sslSupportMethod?: Input<string>;
}

export function applyCustomDomain(
    cloudfront: PulumiAppResource<typeof aws.cloudfront.Distribution>,
    params: CustomDomainParams
) {
    cloudfront.config.aliases(params.domains);

    cloudfront.config.viewerCertificate({
        acmCertificateArn: params.acmCertificateArn,
        sslSupportMethod: params.sslSupportMethod ?? "sni-only"
    });
}
