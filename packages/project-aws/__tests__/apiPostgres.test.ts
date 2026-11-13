import { describe, it, expect, beforeAll, vi } from "vitest";
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import type { PulumiAppModuleDefinition } from "@webiny/pulumi";
import {
    ApiSchemaSetup,
    createPostgresSecretPolicy,
    createSchemaSetupEvent,
    getPostgresLambdaEnv,
    getPostgresLambdaEnvFromCore
} from "~/pulumi/apps/api/ApiSchemaSetup.js";
import { ApiGraphql } from "~/pulumi/apps/api/ApiGraphql.js";
import { ApiGraphqlStream } from "~/pulumi/apps/api/ApiGraphqlStream.js";
import { ApiFileManager } from "~/pulumi/apps/api/ApiFileManager.js";
import { ApiBackgroundTask } from "~/pulumi/apps/api/ApiBackgroundTask.js";
import { createApiServiceManifests } from "~/pulumi/apps/api/apiServiceManifests.js";
import { CoreOutput, type PostgresOutputs } from "~/pulumi/apps/common/CoreOutput.js";
import { VpcConfig } from "~/pulumi/apps/common/VpcConfig.js";
import { sealEnvVariables } from "~/pulumi/utils/lambdaEnvVariables.js";

/* Resolves a Pulumi output (or a plain value) outside of a deployment. */
const resolve = <T>(value: pulumi.Input<T>): Promise<T> => {
    return new Promise(done => pulumi.output(value).apply(done as (value: unknown) => void));
};

const WRITER_ONLY: PostgresOutputs = {
    pgWriterHost: "pg.cluster-abc.eu-central-1.rds.amazonaws.com",
    pgReaderHost: "pg.cluster-ro-abc.eu-central-1.rds.amazonaws.com",
    pgProxyHost: undefined,
    pgPort: 5432,
    pgDatabase: "webiny",
    pgUser: "webiny",
    pgSecretArn: "arn:aws:secretsmanager:eu-central-1:123456789012:secret:pg-db-AbCdEf"
};

const WITH_PROXY: PostgresOutputs = {
    ...WRITER_ONLY,
    pgProxyHost: "pg-proxy.proxy-abc.eu-central-1.rds.amazonaws.com"
};

const NO_POSTGRES: PostgresOutputs = {
    pgWriterHost: undefined,
    pgReaderHost: undefined,
    pgProxyHost: undefined,
    pgPort: undefined,
    pgDatabase: undefined,
    pgUser: undefined,
    pgSecretArn: undefined
};

const FUNCTION_VPC_CONFIG = {
    subnetIds: ["subnet-private-1", "subnet-private-2"],
    securityGroupIds: ["sg-default"]
};

interface RecordedResource {
    type: unknown;
    name: string;
    config: Record<string, any>;
    opts: Record<string, any>;
    output: Record<string, any>;
}

/*
 * A resource's outputs: what it was configured with (fm-download reads the GraphQL function's
 * deployed env), else a string naming the resource and the output, e.g. `graphql.arn`. The same
 * output object on every read, as a real resource's.
 */
const createFakeOutput = (name: string, config: Record<string, any>) => {
    const outputs = new Map<string, pulumi.Output<unknown>>();
    return new Proxy({} as Record<string, pulumi.Output<any>>, {
        get: (_, prop: string | symbol) => {
            if (typeof prop === "symbol") {
                return undefined;
            }
            if (!outputs.has(prop)) {
                let value: unknown = `${name}.${prop}`;
                if (prop in config) {
                    value = config[prop];
                } else if (prop === "functionUrl") {
                    // The stream module reads a hostname off its function URL.
                    value = `https://${name}.lambda-url.aws/`;
                }
                outputs.set(prop, pulumi.output(value));
            }
            return outputs.get(prop);
        }
    });
};

/*
 * A stand-in for the api Pulumi app that records what it is asked to create.
 */
const createFakeApi = (postgres: PostgresOutputs) => {
    const resources: RecordedResource[] = [];
    const modules = new Map<unknown, unknown>();

    const core = pulumi.output({
        ...postgres,
        eventBusName: "event-bus",
        eventBusArn: "event-bus-arn",
        fileManagerBucketId: "fm-bucket"
    });

    modules.set(CoreOutput, core);
    modules.set(VpcConfig, {
        functionVpcConfig: pulumi.output(FUNCTION_VPC_CONFIG),
        enabled: pulumi.output(true)
    });

    const app = {
        env: { name: "dev", isProduction: false },
        paths: { workspace: "/project/.webiny/workspaces/apps/api" },
        addResource(
            type: unknown,
            resource: Omit<RecordedResource, "type" | "output" | "opts"> & {
                opts?: Record<string, any>;
            }
        ) {
            const recorded: RecordedResource = {
                type,
                name: resource.name,
                // `config.clone()`, as on a real resource; not one of the config's own keys.
                config: Object.defineProperty(resource.config, "clone", {
                    value: () => ({ ...resource.config }),
                    enumerable: false
                }),
                opts: resource.opts || {},
                output: createFakeOutput(resource.name, resource.config)
            };
            resources.push(recorded);
            return recorded;
        },
        // Handlers (the AWS account id, the region) aren't run here.
        addHandler() {
            return pulumi.output("handler");
        },
        addModule(def: PulumiAppModuleDefinition<unknown, unknown>, config?: unknown) {
            const created = def.run(app as never, config);
            modules.set(def, created);
            return created;
        },
        getModule(def: unknown) {
            if (!modules.has(def)) {
                throw new Error(`No module ${String((def as { name?: string }).name)}.`);
            }
            return modules.get(def);
        }
    };

    const functions = () => resources.filter(resource => resource.type === aws.lambda.Function);
    const one = (type: unknown, name: string) => {
        const resource = resources.find(item => item.type === type && item.name === name);
        expect(resource, `${name} is created`).toBeDefined();
        return resource!;
    };

    return { app, core, resources, functions, one };
};

/* The api app's modules, in the order `createApiPulumiApp` adds them. */
const addApiModules = (fake: ReturnType<typeof createFakeApi>) => {
    const { app, core } = fake;
    // `createApiPulumiApp` gives both functions of the bundle the same env.
    const graphqlEnv = { DB_TABLE: "table", ...getPostgresLambdaEnvFromCore(core) };
    const graphql = app.addModule(ApiGraphql as never, { env: graphqlEnv }) as ApiGraphql;
    app.addModule(ApiGraphqlStream as never, { env: graphqlEnv });
    app.addModule(ApiFileManager as never, { env: {} });
    const backgroundTask = app.addModule(ApiBackgroundTask as never) as ApiBackgroundTask;
    const serviceManifests = createApiServiceManifests({
        cloudfront: fake.app.addResource(aws.cloudfront.Distribution, {
            name: "api-cloudfront",
            // No custom domain: the API is on the CloudFront domain.
            config: { aliases: [] }
        }) as never,
        graphql,
        backgroundTask,
        scheduler: {
            invokeRole: fake.app.addResource(aws.iam.Role, {
                name: "scheduler-invoke-role",
                config: {}
            }) as never
        }
    });
    const schemaSetup = app.addModule(ApiSchemaSetup as never, {
        postgres: core,
        serviceManifests,
        trigger: "deploy-1"
    }) as ApiSchemaSetup;
    return { graphql, schemaSetup, serviceManifests };
};

describe("the API functions' Postgres env", () => {
    it("connects to the cluster's writer when the core has no RDS Proxy", () => {
        expect(getPostgresLambdaEnv(WRITER_ONLY)).toEqual({
            WEBINY_PG_HOST: WRITER_ONLY.pgWriterHost,
            WEBINY_PG_WRITER_HOST: WRITER_ONLY.pgWriterHost,
            WEBINY_PG_PORT: "5432",
            WEBINY_PG_DATABASE: "webiny",
            WEBINY_PG_USER: "webiny",
            WEBINY_PG_SECRET_ARN: WRITER_ONLY.pgSecretArn,
            WEBINY_PG_SSL: "true",
            NODE_EXTRA_CA_CERTS: "/var/runtime/ca-cert.pem"
        });
    });

    it("connects through the RDS Proxy when the core has one, and keeps the writer for the schema setup", () => {
        const env = getPostgresLambdaEnv(WITH_PROXY);
        expect(env.WEBINY_PG_HOST).toBe(WITH_PROXY.pgProxyHost);
        expect(env.WEBINY_PG_WRITER_HOST).toBe(WITH_PROXY.pgWriterHost);
    });

    it("carries no password", () => {
        const env = getPostgresLambdaEnv(WITH_PROXY);
        expect(Object.keys(env).some(name => /PASSWORD|CONNECTION_STRING/.test(name))).toBe(false);
    });

    it("refuses a core stack without a Postgres database, and says to deploy the core", () => {
        expect(() => getPostgresLambdaEnv(NO_POSTGRES)).toThrow(/yarn webiny deploy core/);
    });

    it("gives one output per env var from the core stack's output", async () => {
        const env = getPostgresLambdaEnvFromCore(pulumi.output(WITH_PROXY));
        const values = Object.fromEntries(
            await Promise.all(
                Object.entries(env).map(async ([name, value]) => [name, await resolve(value)])
            )
        );
        expect(values).toEqual(getPostgresLambdaEnv(WITH_PROXY));
    });
});

describe("the API role's Postgres permission", () => {
    it("allows reading only the core's secret", () => {
        expect(createPostgresSecretPolicy(WRITER_ONLY.pgSecretArn!)).toEqual({
            Version: "2012-10-17",
            Statement: [
                {
                    Sid: "PermissionForPostgresSecret",
                    Effect: "Allow",
                    Action: ["secretsmanager:GetSecretValue"],
                    Resource: [WRITER_ONLY.pgSecretArn]
                }
            ]
        });
    });
});

describe("the schema setup on deploy", () => {
    beforeAll(() => {
        sealEnvVariables();
        // The background-task and fm-download functions add the region's `sharp` layer.
        process.env.AWS_REGION = process.env.AWS_REGION || "eu-central-1";
    });

    it("puts the service manifests in the WebinySqlSchemaSetup event", () => {
        expect(
            createSchemaSetupEvent([
                { name: "api", manifest: { url: "https://d1.cloudfront.net" } },
                { name: "scheduler", manifest: { lambdaArn: "arn:graphql" } }
            ])
        ).toEqual({
            WebinySqlSchemaSetup: {
                serviceManifests: [
                    { name: "api", manifest: { url: "https://d1.cloudfront.net" } },
                    { name: "scheduler", manifest: { lambdaArn: "arn:graphql" } }
                ]
            }
        });
    });

    it("lets the API role read the secret", async () => {
        const fake = createFakeApi(WITH_PROXY);
        const { graphql } = addApiModules(fake);

        const policy = fake.one(aws.iam.RolePolicy, "api-lambda-pg-secret");
        expect(policy.config.role).toBe(graphql.role.output.id);
        expect(JSON.parse(await resolve(policy.config.policy as pulumi.Output<string>))).toEqual(
            createPostgresSecretPolicy(WITH_PROXY.pgSecretArn!)
        );
    });

    it("adds a schema-setup function off the GraphQL function's bundle, role and env, with no route", async () => {
        const fake = createFakeApi(WRITER_ONLY);
        addApiModules(fake);

        const graphql = fake.one(aws.lambda.Function, "graphql");
        const schemaSetup = fake.one(aws.lambda.Function, "schema-setup");

        expect(schemaSetup.config.handler).toBe("handler.handler");
        expect(schemaSetup.config.code).toBe(graphql.config.code);
        expect(schemaSetup.config.role).toBe(graphql.config.role);
        expect(schemaSetup.config.environment).toBe(graphql.config.environment);
        // Lambda's maximum: the setup can wait up to 10 minutes for a new RDS Proxy.
        expect(schemaSetup.config.timeout).toBe(900);

        const env = (await resolve(graphql.config.environment.variables)) as Record<string, string>;
        expect(env).toMatchObject(getPostgresLambdaEnv(WRITER_ONLY));

        // Nothing routes to it: no permission names it, and no gateway or URL exists here.
        const routed = fake.resources.filter(
            resource =>
                resource.type === aws.lambda.Permission || resource.type === aws.lambda.FunctionUrl
        );
        for (const resource of routed) {
            expect(resource.config.function).not.toBe(schemaSetup.output.arn);
            expect(resource.config.functionName).not.toBe(schemaSetup.output.name);
        }
    });

    it("invokes the schema-setup function with the api and scheduler manifests, on every deploy, after the secret permission", async () => {
        const fake = createFakeApi(WRITER_ONLY);
        const { schemaSetup, serviceManifests } = addApiModules(fake);

        const invocation = fake.one(aws.lambda.Invocation, "schema-setup");
        expect(invocation.config.functionName).toBe(schemaSetup.functions.schemaSetup.output.name);
        expect(invocation.config.triggers).toEqual({ deploy: "deploy-1" });
        expect(invocation.opts.dependsOn).toEqual([schemaSetup.secretPolicy.output]);

        const input = JSON.parse(await resolve(invocation.config.input as pulumi.Output<string>));
        expect(input).toEqual({
            WebinySqlSchemaSetup: {
                serviceManifests: [
                    {
                        name: "api",
                        manifest: {
                            url: "https://api-cloudfront.domainName",
                            bgTaskSfn: "background-task-sfn.arn",
                            cloudfront: {
                                distributionId: "api-cloudfront.id",
                                domain: "https://api-cloudfront.domainName"
                            }
                        }
                    },
                    {
                        name: "scheduler",
                        manifest: {
                            lambdaArn: "graphql.arn",
                            roleArn: "scheduler-invoke-role.arn"
                        }
                    }
                ]
            }
        });
        expect(serviceManifests.map(item => item.name)).toEqual(["api", "scheduler"]);
    });

    it("triggers the invocation with the deploy's time by default, so every deploy runs the setup", () => {
        vi.useFakeTimers();
        try {
            const triggerAt = (time: string) => {
                vi.setSystemTime(new Date(time));
                const fake = createFakeApi(WRITER_ONLY);
                fake.app.addModule(ApiGraphql as never, { env: {} });
                fake.app.addModule(ApiSchemaSetup as never, {
                    postgres: fake.core,
                    serviceManifests: []
                });
                return fake.one(aws.lambda.Invocation, "schema-setup").config.triggers;
            };
            expect(triggerAt("2026-11-13T10:00:00.000Z")).toEqual({
                deploy: "2026-11-13T10:00:00.000Z"
            });
            expect(triggerAt("2026-11-13T10:05:00.000Z")).toEqual({
                deploy: "2026-11-13T10:05:00.000Z"
            });
        } finally {
            vi.useRealTimers();
        }
    });

    it("puts every API function in the VPC, the schema-setup function included", async () => {
        const fake = createFakeApi(WRITER_ONLY);
        addApiModules(fake);

        const names = fake.functions().map(fn => fn.name);
        expect(names.sort()).toEqual(
            ["background-task", "fm-download", "graphql", "graphql-stream", "schema-setup"].sort()
        );
        for (const fn of fake.functions()) {
            expect(await resolve(fn.config.vpcConfig), fn.name).toEqual(FUNCTION_VPC_CONFIG);
        }
    });

    it("gives every API function the Postgres env", async () => {
        const fake = createFakeApi(WITH_PROXY);
        addApiModules(fake);

        expect(fake.functions()).toHaveLength(5);
        for (const fn of fake.functions()) {
            const env = (await resolve(fn.config.environment.variables)) as Record<string, string>;
            expect(env, fn.name).toMatchObject(getPostgresLambdaEnv(WITH_PROXY));
        }
    });
});
