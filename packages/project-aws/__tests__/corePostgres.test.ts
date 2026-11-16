import { describe, it, expect } from "vitest";
import * as aws from "@pulumi/aws";
import * as random from "@pulumi/random";
import type { PulumiAppModuleDefinition } from "@webiny/pulumi";
import type { IProjectConfigModel } from "@webiny/project/abstractions/models/index.js";
import type { GetProjectConfigService } from "@webiny/project/abstractions/index.js";
import { Vpc } from "@webiny/project-extensions-aws/extensions/Vpc.js";
import { Postgres } from "@webiny/project-extensions-aws/extensions/Postgres.js";
import { RdsProxy } from "@webiny/project-extensions-aws/extensions/RdsProxy.js";
import { CorePostgres, type CorePostgresParams } from "~/pulumi/apps/core/CorePostgres.js";
import { CoreVpc } from "~/pulumi/apps/core/CoreVpc.js";
import { AddCorePostgresImpl } from "~/extensions/Postgres/AddCorePostgres.js";
import { pickPostgresOutputs } from "~/pulumi/apps/common/CoreOutput.js";
import type { CorePulumiApp } from "~/pulumi/apps/core/createCorePulumiApp.js";

interface RecordedResource {
    type: unknown;
    name: string;
    config: Record<string, any>;
    opts: Record<string, any>;
    output: Record<string, any>;
}

/*
 * A stand-in for the core Pulumi app that records what it is asked to create. A resource's outputs
 * are strings naming the resource and the output, e.g. `pg-db.endpoint`.
 */
const createFakeApp = (params: { isProduction?: boolean; withCoreVpc?: boolean } = {}) => {
    const resources: RecordedResource[] = [];
    const outputs: Record<string, unknown> = {};
    const addedModules: Array<{ def: unknown; config: unknown }> = [];

    const coreVpc = {
        vpc: { output: { defaultSecurityGroupId: "sg-core-default" } },
        subnets: {
            private: ["subnet-private-1", "subnet-private-2", "subnet-private-3"].map(id => ({
                output: { id }
            }))
        }
    };

    const app = {
        env: { name: params.isProduction ? "prod" : "dev", isProduction: !!params.isProduction },
        addResource(type: unknown, resource: Omit<RecordedResource, "type" | "output">) {
            const recorded: RecordedResource = {
                type,
                name: resource.name,
                config: resource.config,
                opts: resource.opts || {},
                output: new Proxy({}, { get: (_, prop) => `${resource.name}.${String(prop)}` })
            };
            resources.push(recorded);
            return recorded;
        },
        addModule(def: PulumiAppModuleDefinition<unknown, unknown>, config: unknown) {
            addedModules.push({ def, config });
            return def.run(app as never, config);
        },
        getModule(def: unknown) {
            return def === CoreVpc && params.withCoreVpc !== false ? coreVpc : null;
        },
        addOutputs(values: Record<string, unknown>) {
            Object.assign(outputs, values);
        }
    };

    const find = (type: unknown) => resources.filter(resource => resource.type === type);
    const one = (type: unknown) => {
        const [resource] = find(type);
        expect(resource, `a resource of the expected type`).toBeDefined();
        return resource;
    };

    return { app, resources, outputs, addedModules, find, one };
};

const network = {
    subnetIds: ["subnet-a", "subnet-b"],
    securityGroupIds: ["sg-db"]
};

const addCorePostgres = (
    fake: ReturnType<typeof createFakeApp>,
    params: Partial<CorePostgresParams> = {}
) =>
    fake.app.addModule(CorePostgres as never, {
        minCapacity: 0.5,
        maxCapacity: 16,
        readers: 0,
        rdsProxy: false,
        network,
        protect: false,
        getEngineVersion: () => "17.4",
        ...params
    }) as ReturnType<typeof CorePostgres.run>;

const PROXY_TYPES = [
    aws.iam.Role,
    aws.iam.RolePolicy,
    aws.rds.Proxy,
    aws.rds.ProxyDefaultTargetGroup,
    aws.rds.ProxyTarget
];

describe("CorePostgres", () => {
    it("creates an Aurora PostgreSQL 17 Serverless v2 cluster with its secret, subnet group and parameter group, and no proxy", () => {
        const fake = createFakeApp();
        addCorePostgres(fake, { minCapacity: 1, maxCapacity: 8 });

        const cluster = fake.one(aws.rds.Cluster);
        expect(cluster.config).toMatchObject({
            engine: "aurora-postgresql",
            engineMode: "provisioned",
            engineVersion: "17.4",
            databaseName: "webiny",
            masterUsername: "webiny",
            masterPassword: "pg-db-password.result",
            storageEncrypted: true,
            dbSubnetGroupName: "pg-db.name",
            dbClusterParameterGroupName: "pg-db.name",
            serverlessv2ScalingConfiguration: { minCapacity: 1, maxCapacity: 8 }
        });
        // A later deploy keeps the version the cluster was created with.
        expect(cluster.opts.ignoreChanges).toEqual(["engineVersion"]);

        expect(fake.one(random.RandomPassword).config).toMatchObject({ length: 32 });
        expect(fake.find(aws.secretsmanager.Secret)).toHaveLength(1);
        expect(fake.one(aws.secretsmanager.SecretVersion).config.secretId).toBe("pg-db.id");

        const parameterGroup = fake.one(aws.rds.ClusterParameterGroup);
        expect(parameterGroup.config.family).toBe("aurora-postgresql17");
        expect(parameterGroup.config.parameters.map((p: { name: string }) => p.name)).toEqual([
            "tcp_keepalives_idle",
            "tcp_keepalives_interval",
            "tcp_keepalives_count"
        ]);

        for (const type of PROXY_TYPES) {
            expect(fake.find(type)).toHaveLength(0);
        }
    });

    it("creates one writer and `readers` readers", () => {
        const none = createFakeApp();
        addCorePostgres(none, { readers: 0 });
        const two = createFakeApp();
        addCorePostgres(two, { readers: 2 });

        expect(none.find(aws.rds.ClusterInstance).map(instance => instance.name)).toEqual([
            "pg-db-writer"
        ]);

        const instances = two.find(aws.rds.ClusterInstance);
        expect(instances.map(instance => instance.name)).toEqual([
            "pg-db-writer",
            "pg-db-reader-1",
            "pg-db-reader-2"
        ]);
        for (const instance of instances) {
            expect(instance.config).toMatchObject({
                clusterIdentifier: "pg-db.id",
                instanceClass: "db.serverless",
                publiclyAccessible: false,
                performanceInsightsEnabled: true
            });
        }
        expect(instances.map(instance => instance.config.promotionTier)).toEqual([0, 1, 1]);
    });

    it("adds the RDS Proxy, its role and policy, the target group and the target with rdsProxy", () => {
        const fake = createFakeApp();
        addCorePostgres(fake, { rdsProxy: true, readers: 1 });

        expect(fake.one(aws.iam.Role).config.assumeRolePolicy).toContain("rds.amazonaws.com");
        expect(fake.one(aws.iam.RolePolicy).config.role).toBe("pg-proxy.id");

        expect(fake.one(aws.rds.Proxy).config).toMatchObject({
            engineFamily: "POSTGRESQL",
            auths: [{ authScheme: "SECRETS", iamAuth: "DISABLED", secretArn: "pg-db.arn" }],
            roleArn: "pg-proxy.arn",
            requireTls: true,
            idleClientTimeout: 900
        });
        expect(fake.one(aws.rds.ProxyDefaultTargetGroup).config.connectionPoolConfig).toEqual({
            maxConnectionsPercent: 70,
            maxIdleConnectionsPercent: 50,
            connectionBorrowTimeout: 10
        });

        const target = fake.one(aws.rds.ProxyTarget);
        expect(target.config.dbClusterIdentifier).toBe("pg-db.id");
        // The target waits for the writer and the reader.
        expect(target.opts.dependsOn).toHaveLength(2);
    });

    it("puts the subnet group, the cluster and the proxy into the given network", () => {
        const fake = createFakeApp();
        addCorePostgres(fake, { rdsProxy: true });

        expect(fake.one(aws.rds.SubnetGroup).config.subnetIds).toEqual(network.subnetIds);
        expect(fake.one(aws.rds.Cluster).config.vpcSecurityGroupIds).toEqual(
            network.securityGroupIds
        );
        expect(fake.one(aws.rds.Proxy).config).toMatchObject({
            vpcSubnetIds: network.subnetIds,
            vpcSecurityGroupIds: network.securityGroupIds
        });
    });

    it("protects a production database: deletion protection, a week of backups and a final snapshot", () => {
        const fake = createFakeApp();
        addCorePostgres(fake, { protect: true });

        const cluster = fake.one(aws.rds.Cluster);
        expect(cluster.config).toMatchObject({
            deletionProtection: true,
            backupRetentionPeriod: 7,
            skipFinalSnapshot: false
        });
        expect(cluster.config.finalSnapshotIdentifier).toBeDefined();
        expect(cluster.opts.protect).toBe(true);
        expect(fake.one(aws.secretsmanager.Secret).opts.protect).toBe(true);
    });

    it("leaves a database outside production unprotected", () => {
        const fake = createFakeApp();
        addCorePostgres(fake, { protect: false });

        const cluster = fake.one(aws.rds.Cluster);
        expect(cluster.config).toMatchObject({
            deletionProtection: false,
            backupRetentionPeriod: 1,
            skipFinalSnapshot: true,
            finalSnapshotIdentifier: undefined
        });
        expect(cluster.opts.protect).toBe(false);
        expect(fake.find(random.RandomId)).toHaveLength(0);
    });

    it("returns the connection outputs, with the proxy host only with the proxy, and no password", () => {
        const withoutProxy = addCorePostgres(createFakeApp());
        const withProxy = addCorePostgres(createFakeApp(), { rdsProxy: true });

        expect(withoutProxy.outputs).toEqual({
            pgWriterHost: "pg-db.endpoint",
            pgReaderHost: "pg-db.readerEndpoint",
            pgPort: 5432,
            pgDatabase: "webiny",
            pgUser: "webiny",
            pgSecretArn: "pg-db.arn"
        });
        expect(withProxy.outputs).toEqual({
            ...withoutProxy.outputs,
            pgProxyHost: "pg-proxy.endpoint"
        });

        for (const outputs of [withoutProxy.outputs, withProxy.outputs]) {
            const values = Object.values(outputs).map(String);
            expect(Object.keys(outputs).join(" ")).not.toMatch(/password/i);
            expect(values).not.toContain("pg-db-password.result");
        }
    });
});

type ExtensionParams = Record<string, unknown>;

const projectConfigWith = (extensions: Array<[unknown, ExtensionParams]>): IProjectConfigModel =>
    ({
        extensionsByType: (type: unknown) =>
            extensions.filter(([ext]) => ext === type).map(([, params]) => ({ params }))
    }) as unknown as IProjectConfigModel;

/* Runs the `<Infra.Postgres />` core Pulumi hook; the module itself only records its params. */
const runHook = async (
    extensions: Array<[unknown, ExtensionParams]>,
    appParams: Parameters<typeof createFakeApp>[0] = {}
) => {
    const fake = createFakeApp(appParams);
    const recordModuleOnly = {
        ...fake.app,
        addModule(def: unknown, config: unknown) {
            fake.addedModules.push({ def, config });
            return { outputs: { pgWriterHost: "writer" } };
        }
    };
    const hook = new AddCorePostgresImpl({
        execute: async () => projectConfigWith(extensions)
    } as unknown as GetProjectConfigService.Interface);
    await hook.execute(recordModuleOnly as unknown as CorePulumiApp);

    const added = fake.addedModules.find(module => module.def === CorePostgres);
    return { fake, params: added?.config as CorePostgresParams | undefined };
};

describe("the <Infra.Postgres /> core Pulumi hook", () => {
    it("adds nothing without <Infra.Postgres />", async () => {
        const { params, fake } = await runHook([[Vpc, { enabled: true }]]);

        expect(params).toBeUndefined();
        expect(fake.outputs).toEqual({});
    });

    it("uses the created VPC's private subnets and default security group", async () => {
        const { params } = await runHook([
            [Postgres, {}],
            [Vpc, { enabled: true }]
        ]);

        expect(params?.network).toEqual({
            subnetIds: ["subnet-private-1", "subnet-private-2", "subnet-private-3"],
            securityGroupIds: ["sg-core-default"]
        });
    });

    it("uses postgresVpcConfig with an existing VPC", async () => {
        const postgresVpcConfig = {
            subnetIds: ["subnet-x", "subnet-y"],
            securityGroupIds: ["sg-x"]
        };
        const { params } = await runHook([
            [Postgres, {}],
            [
                Vpc,
                {
                    enabled: true,
                    useExistingVpc: {
                        lambdaFunctionsVpcConfig: { subnetIds: ["s"], securityGroupIds: ["g"] },
                        postgresVpcConfig
                    }
                }
            ]
        ]);

        expect(params?.network).toEqual(postgresVpcConfig);
    });

    it("passes the settings with their defaults, the proxy switch and protect", async () => {
        const defaults = await runHook([
            [Postgres, {}],
            [Vpc, { enabled: true }]
        ]);
        const custom = await runHook(
            [
                [Postgres, { minCapacity: 2, maxCapacity: 32, readers: 1 }],
                [Vpc, { enabled: true }],
                [RdsProxy, { enabled: true }]
            ],
            { isProduction: true }
        );

        expect(defaults.params).toMatchObject({
            minCapacity: 0.5,
            maxCapacity: 16,
            readers: 0,
            rdsProxy: false,
            protect: false
        });
        expect(custom.params).toMatchObject({
            minCapacity: 2,
            maxCapacity: 32,
            readers: 1,
            rdsProxy: true,
            protect: true
        });
    });

    it("adds the module's outputs to the core stack", async () => {
        const { fake } = await runHook([
            [Postgres, {}],
            [Vpc, { enabled: true }]
        ]);

        expect(fake.outputs).toEqual({ pgWriterHost: "writer" });
    });

    it("throws without a VPC, for a run that skipped the deploy checks", async () => {
        await expect(runHook([[Postgres, {}]], { withCoreVpc: false })).rejects.toThrow(
            "Cannot deploy Postgres without a VPC"
        );
    });
});

describe("CoreOutput", () => {
    it("passes the Postgres connection outputs on to the API app, and nothing else of them", () => {
        const picked = pickPostgresOutputs({
            pgWriterHost: "writer",
            pgReaderHost: "reader",
            pgProxyHost: "proxy",
            pgPort: 5432,
            pgDatabase: "webiny",
            pgUser: "webiny",
            pgSecretArn: "arn:secret",
            pgPassword: "must-not-pass"
        });

        expect(picked).toEqual({
            pgWriterHost: "writer",
            pgReaderHost: "reader",
            pgProxyHost: "proxy",
            pgPort: 5432,
            pgDatabase: "webiny",
            pgUser: "webiny",
            pgSecretArn: "arn:secret"
        });
    });
});
