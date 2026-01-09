import { defineExtension } from "@webiny/project/defineExtension/index.js";

export const BlueGreenDeployments = defineExtension({
    type: "Infra/BlueGreenDeployments",
    tags: { runtimeContext: "project" },
    description: "Enable blue/green deployments for your Webiny project.",
    paramsSchema: ({ z }) => {
        const domainsSchema = z.object({
            acmCertificateArn: z.string(),
            sslSupportMethod: z.enum(["sni-only", "vip"]),
            domains: z.object({
                api: z.array(z.string()).nonempty(),
                admin: z.array(z.string()).nonempty(),
                website: z.array(z.string()).nonempty(),
                preview: z.array(z.string()).nonempty()
            })
        });

        const deploymentSchema = z.object({
            name: z.string(),
            env: z.string(),
            variant: z.string()
        });

        // Tuple: exactly 2 items, both must match DeploymentSchema
        const deploymentsSchema = z.tuple([deploymentSchema, deploymentSchema]);

        return {
            enabled: z.boolean().default(false),
            domains: domainsSchema,
            deployments: deploymentsSchema
        };
    }
});
