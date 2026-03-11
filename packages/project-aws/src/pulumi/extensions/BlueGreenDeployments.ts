import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import type { NonEmptyArray } from "../apps/blueGreen/types.js";

const nonEmptyStringArray = z
    .array(z.string())
    .nonempty()
    .transform(item => {
        return item as NonEmptyArray<string>;
    });

const domainsSchema = z.object({
    acmCertificateArn: z.string(),
    sslSupportMethod: z.enum(["sni-only", "vip"]),
    domains: z.object({
        api: nonEmptyStringArray,
        admin: nonEmptyStringArray,
        website: nonEmptyStringArray,
        preview: nonEmptyStringArray
    })
});

const deploymentSchema = z.object({
    name: z.string(),
    env: z.string(),
    variant: z.string()
});

// Tuple: exactly 2 items, both must match DeploymentSchema
export const deploymentsSchema = z.tuple([deploymentSchema, deploymentSchema]);

export const BlueGreenDeployments = defineExtension({
    type: "Infra/BlueGreenDeployments",
    tags: { runtimeContext: "project" },
    description: "Enable blue/green deployments for your Webiny project.",
    paramsSchema: z.object({
        enabled: z.boolean().default(false),
        domains: domainsSchema,
        deployments: deploymentsSchema
    })
});
