import * as aws from "@pulumi/aws";
import { getLayerArn } from "@webiny/aws-layers";
import type { PulumiApp, PulumiAppModule } from "@webiny/pulumi";
import { createAppModule } from "@webiny/pulumi";

import { ApiGraphql } from "~/pulumi/apps/index.js";

export type ApiFileManager = PulumiAppModule<typeof ApiFileManager>;

interface ApiFileManagerConfig {
    env: Record<string, any>;
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

        return {
            functions: {
                download
            }
        };
    }
});
