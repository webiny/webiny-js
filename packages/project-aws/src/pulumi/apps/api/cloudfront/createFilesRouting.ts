import * as aws from "@pulumi/aws";
import type { PulumiApp } from "@webiny/pulumi";
import type { ApiFileManager } from "../ApiFileManager.js";
import type { DistributionOrigin } from "./constants.js";
import { FILES_ORIGIN_ID } from "./constants.js";

/**
 * `fm-download` behind its Function URL, for when there is no API Gateway. Same setup as the
 * streaming function's URL: AWS_IAM on the URL, an OAC that signs every request.
 */
export function createFilesRouting(app: PulumiApp, fileManager: ApiFileManager) {
    const functionUrl = fileManager.functionUrl;
    if (!functionUrl) {
        throw new Error("`fm-download` has no Function URL to route file requests to.");
    }

    const oac = app.addResource(aws.cloudfront.OriginAccessControl, {
        name: "api-files-oac",
        config: {
            description: "Signs CloudFront requests to the fm-download Lambda Function URL",
            originAccessControlOriginType: "lambda",
            signingBehavior: "always",
            signingProtocol: "sigv4"
        }
    });

    const domainName = functionUrl.output.functionUrl.apply((url: string) => new URL(url).hostname);
    const origin: DistributionOrigin = {
        domainName,
        originId: FILES_ORIGIN_ID,
        originAccessControlId: oac.output.id,
        customOriginConfig: {
            httpPort: 80,
            httpsPort: 443,
            originProtocolPolicy: "https-only",
            originSslProtocols: ["TLSv1.2"]
        }
    };

    return { origin };
}
