import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import type { PulumiApp } from "@webiny/pulumi";
import type { ApiGraphqlWeb } from "../ApiGraphqlWeb.js";

/**
 * Lets the distribution, and nothing else, invoke the web function endpoint. The resource is the
 * function; the statement names the endpoint.
 */
export function allowWebFunctionInvoke(
    app: PulumiApp,
    graphqlWeb: ApiGraphqlWeb,
    distributionArn: pulumi.Input<string>
) {
    app.addResource(aws.lambdaweb.ResourcePolicy, {
        name: "graphql-web-cloudfront-invoke",
        config: {
            resourceArn: graphqlWeb.fn.output.arn,
            policy: pulumi.jsonStringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Principal: { Service: "cloudfront.amazonaws.com" },
                        Action: "lambda:InvokeWebFunctionEndpoint",
                        Resource: graphqlWeb.endpoint.output.arn,
                        Condition: {
                            StringEquals: { "aws:SourceArn": distributionArn }
                        }
                    }
                ]
            })
        }
    });
}
