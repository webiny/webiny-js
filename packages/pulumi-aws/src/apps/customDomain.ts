import { Input } from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { PulumiAppResource } from "@webiny/pulumi";

export interface CustomDomainParams {
    domain: Input<string>;
    acmCertificateArn: Input<string>;
    sslSupportMethod?: Input<string>;
}

export function applyCustomDomain(
    cloudfront: PulumiAppResource<typeof aws.cloudfront.Distribution>,
    params: CustomDomainParams
) {
    cloudfront.config.defaultCacheBehavior(value => {
        const headers = value.forwardedValues!.headers || [];
        value.forwardedValues!.headers = [...headers, "Host"];
        return value;
    });

    cloudfront.config.aliases([params.domain]);
    cloudfront.config.viewerCertificate({
        acmCertificateArn: params.acmCertificateArn,
        sslSupportMethod: params.sslSupportMethod ?? "sni-only"
    });
}
