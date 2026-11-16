import * as aws from "@pulumi/aws";
import { getLayerArn } from "@webiny/aws-layers";
import type { PulumiApp, PulumiAppModule } from "@webiny/pulumi";
import type { PulumiAppResource } from "@webiny/pulumi";
import { createAppModule } from "@webiny/pulumi";

import { ApiGraphql } from "~/pulumi/apps/index.js";

export type ApiFileManager = PulumiAppModule<typeof ApiFileManager>;

interface ApiFileManagerConfig {
    env: Record<string, any>;
    /**
     * With the web function there is no HTTP API Gateway, so CloudFront reaches `fm-download` through
     * a Function URL instead, signed by an OAC.
     */
    functionUrl: boolean;
}

export const ApiFileManager = createAppModule({
    name: "ApiFileManager",
    config(app: PulumiApp, config: ApiFileManagerConfig) {
        const graphql = app.getModule(ApiGraphql);

        const baseConfig = graphql.functions.graphql.config.clone();

        const download = app.addResource(aws.lambda.Function, {
            name: "fm-download",
            config: {
                ...baseConfig,
                memorySize: 1600,
                description: "Serves previously uploaded files.",
                layers: [getLayerArn("sharp")],
                environment: {
                    variables: graphql.functions.graphql.output.environment.apply(env => {
                        return {
                            WEBINY_FUNCTION_TYPE: "asset-delivery",
                            ...env?.variables,
                            ...config.env
                        };
                    })
                },
                loggingConfig: {
                    logFormat: "JSON"
                }
            }
        });

        let functionUrl: PulumiAppResource<typeof aws.lambda.FunctionUrl> | null = null;
        if (config.functionUrl) {
            functionUrl = app.addResource(aws.lambda.FunctionUrl, {
                name: "fm-download-url",
                config: {
                    functionName: download.output.name,
                    // Only CloudFront may call it; see the OAC and permissions in ApiCloudfront.
                    authorizationType: "AWS_IAM",
                    invokeMode: "BUFFERED"
                }
            });
        }

        return {
            functions: {
                download
            },
            functionUrl
        };
    }
});
