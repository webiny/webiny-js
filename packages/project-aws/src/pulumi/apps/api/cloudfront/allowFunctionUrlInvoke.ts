import * as aws from "@pulumi/aws";
import type * as pulumi from "@pulumi/pulumi";
import type { PulumiApp } from "@webiny/pulumi";

interface AllowFunctionUrlInvokeParams {
    name: string;
    functionName: pulumi.Input<string>;
    distributionArn: pulumi.Input<string>;
}

/**
 * Lets the distribution, and nothing else, call a Function URL. Created after the distribution,
 * because it needs its ARN.
 *
 * BOTH statements are required. The OAC-for-Lambda docs list `lambda:InvokeFunctionUrl` AND
 * `lambda:InvokeFunction`; with only the former, Lambda's authorizer rejects every signed request
 * from CloudFront with `AccessDeniedException` and the function is never invoked.
 */
export function allowFunctionUrlInvoke(app: PulumiApp, params: AllowFunctionUrlInvokeParams) {
    app.addResource(aws.lambda.Permission, {
        name: `${params.name}-url-cloudfront-invoke`,
        config: {
            action: "lambda:InvokeFunctionUrl",
            function: params.functionName,
            principal: "cloudfront.amazonaws.com",
            sourceArn: params.distributionArn,
            functionUrlAuthType: "AWS_IAM",
            statementId: "allow-cloudfront-invoke-function-url"
        }
    });

    app.addResource(aws.lambda.Permission, {
        name: `${params.name}-cloudfront-invoke-function`,
        config: {
            action: "lambda:InvokeFunction",
            function: params.functionName,
            principal: "cloudfront.amazonaws.com",
            sourceArn: params.distributionArn,
            statementId: "allow-cloudfront-invoke-function"
        }
    });
}
