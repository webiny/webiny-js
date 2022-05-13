import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import { PulumiApp } from "@webiny/pulumi-sdk";
import { buildCloudFrontFunction, buildLambdaEdge } from "@webiny/project-utils";

export function createLambdas(app: PulumiApp) {
    const role = app.addResource(aws.iam.Role, {
        name: `lambda-edge-role`,
        config: {
            managedPolicyArns: [aws.iam.ManagedPolicies.AWSLambdaBasicExecutionRole],
            assumeRolePolicy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Principal: aws.iam.Principals.LambdaPrincipal,
                        Effect: "Allow"
                    },
                    {
                        Action: "sts:AssumeRole",
                        Principal: aws.iam.Principals.EdgeLambdaPrincipal,
                        Effect: "Allow"
                    }
                ]
            }
        }
    });

    const functions = app.addHandler(() => {
        // Some resources _must_ be put in us-east-1, such as Lambda at Edge,
        // so we need to pass provider to resource options.
        // The problem is, pulumi does not allow to pass provider as `pulumi.Output`,
        // it has to be a created instance.
        // This is why we run the code inside `app.addHandler` wrapper.
        const awsUsEast1 = new aws.Provider("us-east-1", { region: "us-east-1" });

        const viewerRequest = createCloudfrontFunction("viewerRequest");
        const viewerResponse = createCloudfrontFunction("viewerResponse");
        const originRequest = createLambdaEdge("originRequest", awsUsEast1, role.output);
        const adminOriginRequest = createLambdaEdge("adminOriginRequest", awsUsEast1, role.output);
        // This lambda is responsible for fetching traffic splitting config from WCP
        // and caching it inside CloudFront cache.
        const configOriginRequest = createLambdaEdge(
            "configOriginRequest",
            awsUsEast1,
            role.output
        );

        return {
            viewerRequest,
            viewerResponse,
            originRequest,
            adminOriginRequest,
            configOriginRequest
        };
    });

    return {
        role,
        functions
    };
}

function createLambdaEdge(name: string, provider: aws.Provider, role: pulumi.Output<aws.iam.Role>) {
    const file = `@webiny/aws-helpers/stagedRollouts/functions/${name}`;
    const output = buildLambdaEdge(file);

    return new aws.lambda.Function(
        name,
        {
            publish: true,
            runtime: "nodejs14.x",
            handler: "index.default",
            role: role.arn,
            timeout: 5,
            memorySize: 128,
            code: new pulumi.asset.AssetArchive({
                "index.js": new pulumi.asset.StringAsset(output.then(o => o.code))
            })
        },
        { provider }
    );
}

function createCloudfrontFunction(name: string) {
    const file = `@webiny/aws-helpers/stagedRollouts/functions/${name}`;
    const output = buildCloudFrontFunction(file);

    return new aws.cloudfront.Function(name, {
        runtime: "cloudfront-js-1.0",
        code: output.then(o => o.code)
    });
}
