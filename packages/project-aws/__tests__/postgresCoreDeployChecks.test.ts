import { describe, it, expect } from "vitest";
import type { ComponentProps } from "react";
import type { IProjectConfigModel } from "@webiny/project/abstractions/models/index.js";
import type { GetProjectConfigService } from "@webiny/project/abstractions/index.js";
import type { GetProductionEnvironments } from "@webiny/project/abstractions/index.js";
import type { ProjectSdkParamsService } from "@webiny/project/abstractions/index.js";
import type { CoreStackOutputService } from "@webiny/project-extensions-aws/abstractions/index.js";
import { Vpc } from "@webiny/project-extensions-aws/extensions/Vpc.js";
import { Postgres } from "@webiny/project-extensions-aws/extensions/Postgres.js";
import { RdsProxy } from "@webiny/project-extensions-aws/extensions/RdsProxy.js";
import { PulumiOpenSearch } from "@webiny/project-extensions-aws/extensions/PulumiOpenSearch.js";
import { BlueGreenDeployments } from "@webiny/project-extensions-aws/extensions/BlueGreenDeployments.js";
import { DatabaseSetup } from "@webiny/project/extensions/index.js";
import { ValidatePostgresBeforeCoreDeployImpl } from "~/extensions/Postgres/ValidatePostgresBeforeCoreDeploy.js";
import { EnsurePostgresWithRdsProxyImpl } from "~/extensions/RdsProxy/EnsurePostgresWithRdsProxy.js";
import { EnsurePostgresSetupUnchangedImpl } from "~/extensions/ProjectAws/EnsurePostgresSetupUnchanged.js";

type ExtensionParams = Record<string, unknown>;

/* A project config holding the given extensions' params, keyed by extension component. */
const projectConfigWith = (extensions: Array<[unknown, ExtensionParams]>): IProjectConfigModel =>
    ({
        extensionsByType: (type: unknown) =>
            extensions.filter(([ext]) => ext === type).map(([, params]) => ({ params }))
    }) as unknown as IProjectConfigModel;

const getProjectConfigService = (projectConfig: IProjectConfigModel) =>
    ({ execute: async () => projectConfig }) as unknown as GetProjectConfigService.Interface;

const PRODUCTION_ENVS = ["prod", "production"];

const validatePostgres = (extensions: Array<[unknown, ExtensionParams]>, env = "dev") => {
    const hook = new ValidatePostgresBeforeCoreDeployImpl(
        getProjectConfigService(projectConfigWith(extensions)),
        { get: () => ({ env }) } as unknown as ProjectSdkParamsService.Interface,
        { execute: async () => PRODUCTION_ENVS } as unknown as GetProductionEnvironments.Interface
    );
    return hook.execute();
};

/* GracefulError keeps the short reason as its cause and the "what to change" text as its message. */
const failure = async (promise: Promise<unknown>) => {
    try {
        await promise;
    } catch (error) {
        const graceful = error as Error & { cause?: Error };
        return { reason: graceful.cause?.message, message: graceful.message };
    }
    throw new Error("Expected the check to fail, and it passed.");
};

const POSTGRES: [unknown, ExtensionParams] = [Postgres, {}];
const VPC_ENABLED: [unknown, ExtensionParams] = [Vpc, { enabled: true }];
const LAMBDA_VPC = { securityGroupIds: ["sg-lambda"], subnetIds: ["subnet-lambda"] };

describe("deploy core with <Infra.Postgres />", () => {
    it("passes with <Infra.Vpc enabled />", async () => {
        await expect(validatePostgres([POSTGRES, VPC_ENABLED])).resolves.toBeUndefined();
    });

    it("stops without a VPC outside production, and says to add <Infra.Vpc enabled />", async () => {
        const result = await failure(validatePostgres([POSTGRES]));

        expect(result.reason).toBe("Cannot deploy Postgres without a VPC.");
        expect(result.message).toContain("<Infra.Vpc enabled />");
    });

    it("passes in production without <Infra.Vpc>, because production gets a VPC by default", async () => {
        await expect(validatePostgres([POSTGRES], "prod")).resolves.toBeUndefined();
    });

    it("stops in production when <Infra.Vpc enabled={false} /> turns the VPC off", async () => {
        const result = await failure(
            validatePostgres([POSTGRES, [Vpc, { enabled: false }]], "prod")
        );

        expect(result.reason).toBe("Cannot deploy Postgres without a VPC.");
    });

    it("stops with an existing VPC that has no postgresVpcConfig, and asks for it", async () => {
        const result = await failure(
            validatePostgres([
                POSTGRES,
                [Vpc, { enabled: true, useExistingVpc: { lambdaFunctionsVpcConfig: LAMBDA_VPC } }]
            ])
        );

        expect(result.reason).toBe(
            "Cannot deploy Postgres into an existing VPC without `postgresVpcConfig`."
        );
        expect(result.message).toContain("postgresVpcConfig: { subnetIds, securityGroupIds }");
    });

    it("passes with an existing VPC that has postgresVpcConfig", async () => {
        await expect(
            validatePostgres([
                POSTGRES,
                [
                    Vpc,
                    {
                        enabled: true,
                        useExistingVpc: {
                            lambdaFunctionsVpcConfig: LAMBDA_VPC,
                            postgresVpcConfig: {
                                securityGroupIds: ["sg-db"],
                                subnetIds: ["subnet-a", "subnet-b"]
                            }
                        }
                    }
                ]
            ])
        ).resolves.toBeUndefined();
    });

    it("stops with OpenSearch enabled", async () => {
        const result = await failure(
            validatePostgres([POSTGRES, VPC_ENABLED, [PulumiOpenSearch, { enabled: true }]])
        );

        expect(result.reason).toBe("Cannot deploy Postgres with OpenSearch enabled.");
        expect(result.message).toContain("<Infra.OpenSearch enabled />");
    });

    it("passes with OpenSearch explicitly disabled", async () => {
        await expect(
            validatePostgres([POSTGRES, VPC_ENABLED, [PulumiOpenSearch, { enabled: false }]])
        ).resolves.toBeUndefined();
    });

    it("stops with blue-green deployments, which also cover the Sync System", async () => {
        const result = await failure(
            validatePostgres([POSTGRES, VPC_ENABLED, [BlueGreenDeployments, { enabled: true }]])
        );

        expect(result.reason).toBe("Cannot deploy Postgres with blue-green deployments.");
        expect(result.message).toContain("Sync System");
        expect(result.message).toContain("<Infra.BlueGreenDeployments enabled />");
    });

    it("passes with blue-green deployments explicitly disabled", async () => {
        /* Typed from the component, so this is a config a project can actually write:
           <Infra.BlueGreenDeployments> needs `domains` and `deployments` even when disabled. */
        const blueGreenDisabled: ComponentProps<typeof BlueGreenDeployments> = {
            enabled: false,
            domains: {
                acmCertificateArn: "arn:aws:acm:us-east-1:000000000000:certificate/example",
                sslSupportMethod: "sni-only",
                domains: { api: ["api.example.com"], admin: ["admin.example.com"] }
            },
            deployments: [
                { name: "green", env: "dev", variant: "green" },
                { name: "blue", env: "dev", variant: "blue" }
            ]
        };

        await expect(
            validatePostgres([POSTGRES, VPC_ENABLED, [BlueGreenDeployments, blueGreenDisabled]])
        ).resolves.toBeUndefined();
    });
});

describe("deploy core with <Infra.RdsProxy enabled />", () => {
    const ensurePostgres = (extensions: Array<[unknown, ExtensionParams]>) =>
        new EnsurePostgresWithRdsProxyImpl(
            getProjectConfigService(projectConfigWith(extensions))
        ).execute();

    it("stops without <Infra.Postgres />, and says to add it", async () => {
        const result = await failure(ensurePostgres([[RdsProxy, { enabled: true }]]));

        expect(result.reason).toBe("Cannot deploy an RDS Proxy without Postgres.");
        expect(result.message).toContain("<Infra.Postgres />");
    });

    it("passes with <Infra.Postgres />", async () => {
        await expect(
            ensurePostgres([POSTGRES, [RdsProxy, { enabled: true }]])
        ).resolves.toBeUndefined();
    });
});

describe("deploy core on a core that was already deployed", () => {
    const ensureUnchanged = (deployedSetup: string | undefined, configuredSetup?: string) =>
        new EnsurePostgresSetupUnchangedImpl(
            {
                execute: async () => (deployedSetup ? { databaseSetup: deployedSetup } : null)
            } as unknown as CoreStackOutputService.Interface,
            getProjectConfigService(
                projectConfigWith(
                    configuredSetup ? [[DatabaseSetup, { setupName: configuredSetup }]] : []
                )
            )
        ).execute();

    it("passes on a first deploy with Postgres", async () => {
        await expect(ensureUnchanged(undefined, "pg")).resolves.toBeUndefined();
    });

    it("passes on a redeploy with the same database setup", async () => {
        await expect(ensureUnchanged("pg", "pg")).resolves.toBeUndefined();
        await expect(ensureUnchanged("ddb", "ddb")).resolves.toBeUndefined();
        await expect(ensureUnchanged("ddb+os", "ddb+os")).resolves.toBeUndefined();
    });

    it("leaves switches between the DynamoDB setups to the existing checks", async () => {
        await expect(ensureUnchanged("ddb", "ddb+os")).resolves.toBeUndefined();
    });

    it("stops a core deployed with DynamoDB from switching to Postgres", async () => {
        const fromDdb = await failure(ensureUnchanged("ddb", "pg"));
        const fromOs = await failure(ensureUnchanged("ddb+os", "pg"));

        expect(fromDdb.reason).toBe(
            `Cannot deploy with Postgres. The Core application was deployed with the "ddb" database setup.`
        );
        expect(fromOs.reason).toContain(`"ddb+os"`);
        expect(fromDdb.message).toContain("destroy the project and deploy it again");
    });

    it("stops a core deployed with Postgres from switching away, also when no setup is configured", async () => {
        const toOs = await failure(ensureUnchanged("pg", "ddb+os"));
        const toDefault = await failure(ensureUnchanged("pg"));

        expect(toOs.reason).toBe(
            `Cannot deploy without Postgres. The Core application was deployed with the "pg" database setup.`
        );
        expect(toDefault.reason).toBe(toOs.reason);
    });
});
