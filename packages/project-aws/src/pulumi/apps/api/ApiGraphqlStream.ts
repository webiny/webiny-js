import path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import type { PulumiApp, PulumiAppModule } from "@webiny/pulumi";
import { createAppModule } from "@webiny/pulumi";
import { getCommonLambdaEnvVariables } from "../lambdaUtils.js";
import { VpcConfig } from "~/pulumi/apps/index.js";
import { LAMBDA_RUNTIME } from "~/pulumi/constants.js";
import { ApiGraphql } from "./ApiGraphql.js";

interface GraphqlStreamParams {
    env: Record<string, any>;
}

export type ApiGraphqlStream = PulumiAppModule<typeof ApiGraphqlStream>;

/**
 * The response-streaming twin of {@link ApiGraphql}.
 *
 * Why a second Lambda function rather than a second route on the existing one: API Gateway buffers the
 * entire Lambda response no matter how it was produced, so it cannot stream at all. Streaming requires
 * a Lambda Function URL with `InvokeMode: RESPONSE_STREAM`, and the response has to be produced by an
 * `awslambda.streamifyResponse` handler — but a Lambda's handler entry point is fixed per function. So:
 * same code bundle, same IAM role, different entry point (`handler.streamHandler`), reached through a
 * Function URL instead of API Gateway.
 *
 * The Function URL is NOT public. It uses `AWS_IAM` authorization and is invoked only by CloudFront,
 * which signs each request using an Origin Access Control (see ApiCloudfront).
 */
export const ApiGraphqlStream = createAppModule({
    name: "ApiGraphqlStream",
    config(app: PulumiApp, params: GraphqlStreamParams) {
        // Reuse the buffered function's role and policy: identical permissions, and duplicating the
        // policy would mean two places to keep in sync.
        const { role } = app.getModule(ApiGraphql);

        const graphqlStream = app.addResource(aws.lambda.Function, {
            name: "graphql-stream",
            config: {
                description: "Webiny's streaming HTTP routes",
                runtime: LAMBDA_RUNTIME,
                // Second export of the SAME bundle that backs the `graphql` function.
                handler: "handler.streamHandler",
                role: role.output.arn,
                // Streaming exists for long-running work (AI token streams). API Gateway's hard 30s
                // cap doesn't apply to a Function URL, so allow well beyond the buffered function's 30s.
                timeout: 300,
                memorySize: 1024,
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive(
                        path.join(app.paths.workspace, "graphql/build")
                    )
                }),
                environment: {
                    variables: getCommonLambdaEnvVariables().apply(value => ({
                        ...value,
                        ...params.env,
                        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1"
                    }))
                },
                vpcConfig: app.getModule(VpcConfig).functionVpcConfig,
                loggingConfig: {
                    logFormat: "JSON"
                }
            }
        });

        const functionUrl = app.addResource(aws.lambda.FunctionUrl, {
            name: "graphql-stream-url",
            config: {
                functionName: graphqlStream.output.name,
                // Locked to signed CloudFront requests; see the OAC + invoke permission below.
                authorizationType: "AWS_IAM",
                // The whole point: without RESPONSE_STREAM the runtime buffers the response and
                // `streamifyResponse` has no effect.
                invokeMode: "RESPONSE_STREAM"
            }
        });

        return {
            role,
            functions: {
                graphqlStream
            },
            functionUrl,
            /** Origin domain for CloudFront, e.g. `abc123.lambda-url.eu-central-1.on.aws`. */
            functionUrlDomain: functionUrl.output.functionUrl.apply(
                (url: string) => new URL(url).hostname
            )
        };
    }
});
