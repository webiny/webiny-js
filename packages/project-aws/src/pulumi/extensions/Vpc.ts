import { defineExtension } from "@webiny/project/defineExtension/index.js";

export const Vpc = defineExtension({
    type: "Infra/Vpc",
    tags: { runtimeContext: "project" },
    description: "Apply VPC settings to AWS resources during deployment.",
    paramsSchema: ({ z }) => ({
        enabled: z.boolean().describe("Whether to enable VPC.").default(false),
        useVpcEndpoints: z
            .boolean()
            .optional()
            .describe("Whether to use VPC endpoints for AWS services."),
        useExistingVpc: z
            .object({
                openSearchDomainVpcConfig: z
                    .object({
                        securityGroupIds: z
                            .array(z.string())
                            .describe("The security group IDs for the OpenSearch domain."),
                        subnetIds: z
                            .array(z.string())
                            .describe("The subnet IDs for the OpenSearch domain.")
                    })
                    .optional()
                    .describe("VPC configuration for an existing OpenSearch domain."),
                lambdaFunctionsVpcConfig: z
                    .object({
                        securityGroupIds: z
                            .array(z.string())
                            .describe("The security group IDs for the Lambda functions."),
                        subnetIds: z
                            .array(z.string())
                            .describe("The subnet IDs for the Lambda functions.")
                    })
                    .describe("VPC configuration for Lambda functions.")
            })
            .optional()
            .describe("Configuration for using an existing VPC.")
    })
});
