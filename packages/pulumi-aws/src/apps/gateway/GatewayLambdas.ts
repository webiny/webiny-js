import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import { PulumiApp } from "@webiny/pulumi-sdk";
import { buildLambdaEdge } from "@webiny/project-utils";

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
        // Some resources _must_ be put in us-east-1, such as Lambda at Edge.
        const awsUsEast1 = new aws.Provider("us-east-1", { region: "us-east-1" });

        const pageViewerRequest = createLambda("pageViewerRequest", awsUsEast1, role.output);
        const pageOriginRequest = createLambda("pageOriginRequest", awsUsEast1, role.output);
        const pageOriginResponse = createLambda("pageOriginResponse", awsUsEast1, role.output);
        const assetOriginRequest = createLambda("assetOriginRequest", awsUsEast1, role.output);

        return {
            pageViewerRequest,
            pageOriginRequest,
            pageOriginResponse,
            assetOriginRequest
        };
    });

    return {
        role,
        functions
    };
}

function createLambda(name: string, provider: aws.Provider, role: pulumi.Output<aws.iam.Role>) {
    const content = [
        `import { ${name} } from '@webiny/aws-helpers/stagedRollouts';`,
        `export default ${name}`
    ];
    const output = buildLambdaEdge(content.join("\n"));

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
