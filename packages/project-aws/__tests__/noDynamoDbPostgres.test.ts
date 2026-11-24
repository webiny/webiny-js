import { describe, it, expect } from "vitest";
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import type { PulumiAppModuleDefinition } from "@webiny/pulumi";
import { addCoreDynamoDb } from "~/pulumi/apps/core/coreDynamoDb.js";
import { addCoreVpcEndpoints } from "~/pulumi/apps/core/coreVpcEndpoints.js";
import { CoreDynamo } from "~/pulumi/apps/core/CoreDynamo.js";
import { CoreAuditLogsDynamo } from "~/pulumi/apps/core/CoreAuditLogsDynamo.js";
import { ApiGraphql } from "~/pulumi/apps/api/ApiGraphql.js";
import { addDynamoDbOutputs, getDynamoDbLambdaEnv } from "~/pulumi/apps/api/apiDynamoDb.js";
import { addAdminSettingsItem } from "~/pulumi/apps/react/adminSettingsItem.js";
import { CoreOutput } from "~/pulumi/apps/common/CoreOutput.js";
import { VpcConfig } from "~/pulumi/apps/common/VpcConfig.js";

/* Resolves a Pulumi output (or a plain value) outside of a deployment. */
const resolve = <T>(value: pulumi.Input<T>): Promise<T> => {
    return new Promise(done => pulumi.output(value).apply(done as (value: unknown) => void));
};

/* The core stack output of a project without `<Infra.AuroraPostgres />`. */
const DYNAMODB_CORE = {
    primaryDynamodbTableArn: "arn:aws:dynamodb:eu-central-1:123456789012:table/wby-primary",
    primaryDynamodbTableName: "wby-primary",
    primaryDynamodbTableHashKey: "PK",
    primaryDynamodbTableRangeKey: "SK",
    auditLogsDynamodbTableArn: "arn:aws:dynamodb:eu-central-1:123456789012:table/wby-audit-logs",
    auditLogsDynamodbTableName: "wby-audit-logs",
    fileManagerBucketId: "fm-bucket",
    cognitoUserPoolArn: "user-pool-arn",
    eventBusArn: "event-bus-arn"
};

/* The core stack output with `<Infra.AuroraPostgres />`: no DynamoDB table in it. */
const POSTGRES_CORE = {
    fileManagerBucketId: "fm-bucket",
    cognitoUserPoolArn: "user-pool-arn",
    eventBusArn: "event-bus-arn",
    pgWriterHost: "pg.cluster-abc.eu-central-1.rds.amazonaws.com"
};

const OPENSEARCH_TABLE_ARN = "arn:aws:dynamodb:eu-central-1:123456789012:table/wby-os";

interface RecordedResource {
    type: unknown;
    name: string;
    config: Record<string, any>;
    output: Record<string, any>;
}

/*
 * A stand-in for a Pulumi app that records the resources, modules and outputs it is asked to add.
 * A resource's outputs are strings naming the resource and the output, e.g. `webiny.arn`.
 */
const createFakeApp = (core: Record<string, unknown> = DYNAMODB_CORE) => {
    const resources: RecordedResource[] = [];
    const outputs: Record<string, unknown> = {};
    const modules = new Map<unknown, unknown>([
        [CoreOutput, pulumi.output(core)],
        [VpcConfig, { functionVpcConfig: pulumi.output(undefined), enabled: pulumi.output(false) }]
    ]);
    const addedModules: unknown[] = [];

    const app = {
        env: { name: "dev", isProduction: false },
        paths: { workspace: "/project/.webiny/workspaces/apps/api" },
        addResource(type: unknown, resource: { name: string; config: Record<string, any> }) {
            const recorded: RecordedResource = {
                type,
                name: resource.name,
                config: resource.config,
                output: new Proxy({}, { get: (_, prop) => `${resource.name}.${String(prop)}` })
            };
            resources.push(recorded);
            return recorded;
        },
        addModule(def: PulumiAppModuleDefinition<unknown, unknown>, config?: unknown) {
            addedModules.push(def);
            const created = def.run(app as never, config);
            modules.set(def, created);
            return created;
        },
        getModule(def: unknown) {
            return modules.get(def);
        },
        // Handlers (the AWS account id, the region) aren't run here.
        addHandler() {
            return pulumi.output("handler");
        },
        addOutputs(values: Record<string, unknown>) {
            Object.assign(outputs, values);
        }
    };

    const ofType = (type: unknown) => resources.filter(resource => resource.type === type);

    return { app: app as never, resources, outputs, addedModules, ofType };
};

const DYNAMODB_OUTPUTS = [
    "primaryDynamodbTableArn",
    "primaryDynamodbTableName",
    "primaryDynamodbTableHashKey",
    "primaryDynamodbTableRangeKey",
    "auditLogsDynamodbTableArn",
    "auditLogsDynamodbTableName",
    "auditLogsDynamodbTableHashKey",
    "auditLogsDynamodbTableRangeKey"
];

describe("the core's DynamoDB tables", () => {
    it("aren't created with <Infra.AuroraPostgres />, and the core has no DynamoDB output", () => {
        const fake = createFakeApp();
        const tables = addCoreDynamoDb(fake.app, {
            usesPostgres: true,
            protect: true,
            pointInTimeRecovery: true
        });

        expect(tables).toEqual({ dynamoDbTable: undefined, auditLogsDynamoDbTable: undefined });
        expect(fake.resources).toEqual([]);
        expect(fake.addedModules).toEqual([]);
        expect(fake.outputs).toEqual({});
    });

    it("are the primary and the audit logs table without Postgres, with their outputs, as before", () => {
        const fake = createFakeApp();
        const { dynamoDbTable, auditLogsDynamoDbTable } = addCoreDynamoDb(fake.app, {
            usesPostgres: false,
            protect: true,
            pointInTimeRecovery: true
        });

        expect(fake.addedModules).toEqual([CoreDynamo, CoreAuditLogsDynamo]);
        const tables = fake.ofType(aws.dynamodb.Table);
        expect(tables.map(table => table.name)).toEqual(["webiny", "webiny-audit-logs"]);
        for (const table of tables) {
            expect(table.config.pointInTimeRecovery, table.name).toEqual({ enabled: true });
        }
        expect(dynamoDbTable).toBe(tables[0]);
        expect(auditLogsDynamoDbTable).toBe(tables[1]);

        expect(Object.keys(fake.outputs)).toEqual(DYNAMODB_OUTPUTS);
        expect(fake.outputs.primaryDynamodbTableName).toBe("webiny.name");
        expect(fake.outputs.auditLogsDynamodbTableArn).toBe("webiny-audit-logs.arn");
    });
});

describe("the core's VPC endpoints", () => {
    const vpc = {
        vpc: { output: { id: "vpc-1", defaultSecurityGroupId: "sg-default" } },
        subnets: { private: [{ output: { id: "subnet-1" } }, { output: { id: "subnet-2" } }] },
        routeTables: { privateSubnets: { output: { id: "rt-private" } } }
    } as never;

    const endpoints = (usesPostgres: boolean) => {
        const fake = createFakeApp();
        addCoreVpcEndpoints(fake.app, { vpc, region: "eu-central-1", usesPostgres });
        return fake.ofType(aws.ec2.VpcEndpoint);
    };

    it("have no DynamoDB endpoint with <Infra.AuroraPostgres />", async () => {
        const created = endpoints(true);
        expect(created.map(endpoint => endpoint.name)).toEqual([
            "vpc-s3-vpc-endpoint",
            "vpc-sqs-vpc-endpoint",
            "vpc-events-vpc-endpoint"
        ]);
        const services = await Promise.all(
            created.map(endpoint => resolve(endpoint.config.serviceName))
        );
        expect(services.some(service => String(service).endsWith(".dynamodb"))).toBe(false);
    });

    it("are S3, DynamoDB, SQS and EventBridge without Postgres, as before", async () => {
        const created = endpoints(false);
        expect(created.map(endpoint => endpoint.name)).toEqual([
            "vpc-s3-vpc-endpoint",
            "vpc-dynamodb-vpc-endpoint",
            "vpc-sqs-vpc-endpoint",
            "vpc-events-vpc-endpoint"
        ]);
        const dynamodb = created[1];
        expect(await resolve(dynamodb.config.serviceName)).toBe(
            "com.amazonaws.eu-central-1.dynamodb"
        );
        expect(dynamodb.config.routeTableIds).toEqual(["rt-private"]);
        expect(dynamodb.config.vpcEndpointType).toBeUndefined();
    });
});

describe("the api's GraphQL policy", () => {
    const policyOf = async (core: Record<string, unknown>) => {
        const fake = createFakeApp(core);
        fake.app.addModule(ApiGraphql as never, { env: {} });
        const [policy] = fake.ofType(aws.iam.Policy);
        return (await resolve(policy.config.policy)) as aws.iam.PolicyDocument;
    };

    it("has no DynamoDB statement with <Infra.AuroraPostgres />", async () => {
        const policy = await policyOf(POSTGRES_CORE);
        const statements = policy.Statement as aws.iam.PolicyStatement[];

        expect(statements.map(statement => statement.Sid)).toEqual([
            "PermissionForS3",
            "PermissionForLambda",
            "PermissionForCognitoIdp",
            "PermissionForEventBus",
            "PermissionForCloudfront"
        ]);
        expect(JSON.stringify(policy)).not.toMatch(/dynamodb|undefined/i);
    });

    it("allows DynamoDB on the core's tables first without Postgres, as before", async () => {
        const policy = await policyOf(DYNAMODB_CORE);
        const [dynamodb, ...rest] = policy.Statement as aws.iam.PolicyStatement[];

        expect(dynamodb.Sid).toBe("PermissionForDynamodb");
        expect(dynamodb.Effect).toBe("Allow");
        expect(dynamodb.Action).toHaveLength(50);
        expect(dynamodb.Action).toContain("dynamodb:Query");
        expect(dynamodb.Resource).toEqual([
            DYNAMODB_CORE.primaryDynamodbTableArn,
            `${DYNAMODB_CORE.primaryDynamodbTableArn}/*`,
            DYNAMODB_CORE.auditLogsDynamodbTableArn,
            `${DYNAMODB_CORE.auditLogsDynamodbTableArn}/*`
        ]);
        expect(rest.map(statement => statement.Sid)).toEqual([
            "PermissionForS3",
            "PermissionForLambda",
            "PermissionForCognitoIdp",
            "PermissionForEventBus",
            "PermissionForCloudfront"
        ]);
    });

    it("also covers the OpenSearch table, with OpenSearch", async () => {
        const opensearchTable = "arn:aws:dynamodb:eu-central-1:123456789012:table/wby-os";
        const policy = await policyOf({
            ...DYNAMODB_CORE,
            opensearchDynamodbTableArn: opensearchTable
        });
        const [dynamodb] = policy.Statement as aws.iam.PolicyStatement[];
        expect(dynamodb.Resource).toEqual(
            expect.arrayContaining([opensearchTable, `${opensearchTable}/*`])
        );
    });

    it("covers only the OpenSearch table with <Infra.AuroraPostgres /> and OpenSearch", async () => {
        const policy = await policyOf({
            ...POSTGRES_CORE,
            opensearchDynamodbTableArn: OPENSEARCH_TABLE_ARN
        });
        const [dynamodb] = policy.Statement as aws.iam.PolicyStatement[];

        expect(dynamodb.Sid).toBe("PermissionForDynamodb");
        expect(dynamodb.Resource).toEqual([OPENSEARCH_TABLE_ARN, `${OPENSEARCH_TABLE_ARN}/*`]);
        expect(JSON.stringify(policy)).not.toMatch(/undefined/);
    });
});

describe("the api's DynamoDB env and outputs", () => {
    it("are none with <Infra.AuroraPostgres />", async () => {
        const fake = createFakeApp(POSTGRES_CORE);
        const core = pulumi.output(POSTGRES_CORE) as never;
        const env = getDynamoDbLambdaEnv(core, true);
        expect(Object.keys(env)).toEqual(["DB_TABLE_OPENSEARCH"]);
        expect(await resolve(env.DB_TABLE_OPENSEARCH!)).toBeUndefined();

        addDynamoDbOutputs(fake.app, core, true);
        expect(fake.outputs).toEqual({});
    });

    it("keep the OpenSearch table with <Infra.AuroraPostgres /> and OpenSearch", async () => {
        const core = pulumi.output({
            ...POSTGRES_CORE,
            opensearchDynamodbTableName: "wby-os"
        }) as never;
        const env = getDynamoDbLambdaEnv(core, true);
        expect(Object.keys(env)).toEqual(["DB_TABLE_OPENSEARCH"]);
        expect(await resolve(env.DB_TABLE_OPENSEARCH!)).toBe("wby-os");
    });

    it("name the core's tables without Postgres, as before", async () => {
        const fake = createFakeApp(DYNAMODB_CORE);
        const core = pulumi.output({
            ...DYNAMODB_CORE,
            opensearchDynamodbTableName: undefined
        }) as never;

        const env = getDynamoDbLambdaEnv(core, false);
        expect(Object.keys(env)).toEqual([
            "DB_TABLE",
            "DB_TABLE_AUDIT_LOGS",
            "DB_TABLE_OPENSEARCH"
        ]);
        expect(await resolve(env.DB_TABLE!)).toBe("wby-primary");
        expect(await resolve(env.DB_TABLE_AUDIT_LOGS!)).toBe("wby-audit-logs");

        addDynamoDbOutputs(fake.app, core, false);
        expect(Object.keys(fake.outputs)).toEqual(["dynamoDbTable", "auditLogsDynamoDbTable"]);
        expect(await resolve(fake.outputs.dynamoDbTable as never)).toBe("wby-primary");
        expect(await resolve(fake.outputs.auditLogsDynamoDbTable as never)).toBe("wby-audit-logs");
    });
});

describe("the admin app's ADMIN#SETTINGS item", () => {
    const cloudfront = { output: { domainName: pulumi.output("d1.cloudfront.net") } };

    it("isn't written with <Infra.AuroraPostgres />", () => {
        const fake = createFakeApp(POSTGRES_CORE);
        const item = addAdminSettingsItem(fake.app, {
            core: pulumi.output(POSTGRES_CORE) as never,
            cloudfront,
            usesPostgres: true
        });

        expect(item).toBeNull();
        expect(fake.resources).toEqual([]);
    });

    it("stores the app URL in the core's table without Postgres, as before", async () => {
        const fake = createFakeApp();
        addAdminSettingsItem(fake.app, {
            core: pulumi.output(DYNAMODB_CORE) as never,
            cloudfront,
            usesPostgres: false
        });

        const [item] = fake.ofType(aws.dynamodb.TableItem);
        expect(item.name).toBe("adminSettings");
        expect(await resolve(item.config.tableName)).toBe("wby-primary");
        expect(await resolve(item.config.hashKey)).toBe("PK");
        expect(await resolve(item.config.rangeKey)).toBe("SK");
        expect(JSON.parse(await resolve(item.config.item))).toEqual({
            PK: { S: "ADMIN#SETTINGS" },
            SK: { S: "default" },
            data: { M: { appUrl: { S: "https://d1.cloudfront.net" } } }
        });
    });
});
