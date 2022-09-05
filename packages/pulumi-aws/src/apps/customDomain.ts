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
    cloudfront.config.defaultCacheBehavior(value => {
        return {
            ...value,
            forwardedValues: {
                ...value.forwardedValues,
                queryString: value.forwardedValues?.queryString || false,
                cookies: value.forwardedValues?.cookies || { forward: "none" },
                headers: [...(value.forwardedValues?.headers || []), "Host"]
            }
        };
    });

    cloudfront.config.aliases(params.domains);

    cloudfront.config.viewerCertificate({
        acmCertificateArn: params.acmCertificateArn,
        sslSupportMethod: params.sslSupportMethod ?? "sni-only"
    });
}
