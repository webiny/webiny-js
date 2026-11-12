import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { z } from "zod";

export const Vpc = defineExtension({
    type: "Infra/Vpc",
    tags: { runtimeContext: "project", hosting: "aws" },
    description: "Apply VPC settings to AWS resources during deployment.",
    paramsSchema: z.object({
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
                postgresVpcConfig: z
                    .object({
                        securityGroupIds: z
                            .array(z.string())
                            .describe(
                                "The security group IDs for the Postgres database and its RDS Proxy. They must accept port 5432 from the Lambda functions' security groups."
                            ),
                        subnetIds: z
                            .array(z.string())
                            .describe(
                                "The subnet IDs for the Postgres database and its RDS Proxy (at least two availability zones)."
                            )
                    })
                    .optional()
                    .describe(
                        "VPC configuration for the Postgres database. Required with `<Infra.Postgres />`."
                    ),
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
