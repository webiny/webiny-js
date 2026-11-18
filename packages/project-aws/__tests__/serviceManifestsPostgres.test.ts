import { describe, it, expect, vi, beforeEach } from "vitest";
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import type { PulumiApp } from "@webiny/pulumi";

vi.mock("~/pulumi/apps/extensions/projectUsesPostgres.js", () => ({
    projectUsesPostgres: vi.fn()
}));

// Records the DynamoDB items instead of creating them: a `TableItem` can't exist outside a deploy.
vi.mock("~/pulumi/utils/addServiceManifestTableItem.js", async importOriginal => ({
    ...(await importOriginal<object>()),
    addServiceManifestTableItem: vi.fn()
}));

import { projectUsesPostgres } from "~/pulumi/apps/extensions/projectUsesPostgres.js";
import {
    addServiceManifestTableItem,
    type ServiceManifest
} from "~/pulumi/utils/addServiceManifestTableItem.js";
import {
    getSchemaSetupFunctionArn,
    SERVICE_MANIFESTS_INVOCATION_NAME,
    withServiceManifest,
    type WithServiceManifest
} from "~/pulumi/utils/withServiceManifest.js";
import { ApiOutput } from "~/pulumi/apps/api/ApiOutput.js";
import { CoreOutput } from "~/pulumi/apps/common/CoreOutput.js";
import { getSchemaSetupServiceManifests } from "~/pulumi/apps/api/ApiSchemaSetup.js";
import {
    addServiceManifestsOutput,
    CORE_SERVICE_MANIFESTS_OUTPUT,
    createCoreServiceManifest
} from "~/pulumi/apps/core/coreServiceManifests.js";

type ProgramApp = PulumiApp & WithServiceManifest;

/* Resolves a Pulumi output (or a plain value) outside of a deployment. */
const resolve = <T>(value: pulumi.Input<T>): Promise<T> => {
    return new Promise(done => pulumi.output(value).apply(done as (value: unknown) => void));
};

const SCHEMA_SETUP_ARN = "arn:aws:lambda:eu-central-1:123456789012:function:wby-schema-setup";

const API_OUTPUT = {
    apiUrl: "https://api.cloudfront.net",
    schemaSetupLambdaArn: SCHEMA_SETUP_ARN
};

const CORE_OUTPUT = {
    primaryDynamodbTableName: "wby-primary",
    primaryDynamodbTableHashKey: "PK",
    primaryDynamodbTableRangeKey: "SK"
};

interface RecordedResource {
    type: unknown;
    name: string;
    config: Record<string, any>;
}

/*
 * A stand-in for a Pulumi app (the admin's) with the parts `withServiceManifest` uses: the decorated
 * program first, then every handler in the order it was added, also those added while handlers run.
 */
const createFakeApp = (api: Record<string, unknown> = API_OUTPUT) => {
    const handlers: Array<() => unknown> = [];
    const resources: RecordedResource[] = [];
    const outputs: Record<string, unknown> = {};
    const modules = new Map<unknown, unknown>([
        [ApiOutput, pulumi.output(api)],
        [CoreOutput, pulumi.output(CORE_OUTPUT)]
    ]);
    let decorator: ((program: (app: unknown) => unknown, app: unknown) => unknown) | undefined;

    const app = {
        name: "admin",
        handlers,
        decorateProgram(cb: typeof decorator) {
            decorator = cb;
        },
        addHandler(handler: () => unknown) {
            handlers.push(handler);
            return pulumi.output(undefined);
        },
        addResource(type: unknown, params: { name: string; config: Record<string, any> }) {
            const resource = { type, name: params.name, config: params.config };
            resources.push(resource);
            return resource;
        },
        addOutput(name: string, value: unknown) {
            outputs[name] = value;
        },
        getModule(def: unknown) {
            if (!modules.has(def)) {
                throw new Error(`No module ${String((def as { name?: string }).name)}.`);
            }
            return modules.get(def);
        }
    };

    const run = async (program: (app: ProgramApp) => unknown = () => undefined) => {
        await decorator!(program as (app: unknown) => unknown, app);
        for (const handler of app.handlers) {
            await handler();
        }
    };

    const invocations = () => resources.filter(resource => resource.type === aws.lambda.Invocation);

    return { app: app as unknown as PulumiApp, run, resources, outputs, invocations };
};

const adminManifest = (url: string): ServiceManifest => ({
    name: "admin",
    manifest: {
        url: pulumi.output(url),
        cloudfront: { distributionId: pulumi.output("E123"), domain: pulumi.output(url) }
    }
});

/* Deploys a fake admin app with the given admin URL; returns what it created. */
const deployAdmin = async (url: string) => {
    const fake = createFakeApp();
    const app = withServiceManifest(fake.app);
    app.addHandler(() => app.addServiceManifest(adminManifest(url)));
    await fake.run();
    return fake;
};

const usePostgres = (enabled: boolean) => {
    vi.mocked(projectUsesPostgres).mockResolvedValue(enabled);
};

beforeEach(() => {
    vi.mocked(addServiceManifestTableItem).mockClear();
    vi.mocked(projectUsesPostgres).mockReset();
});

describe("an app's service manifests with <Infra.Postgres />", () => {
    it("go to the api's schema-setup function, by its ARN, with only the app's manifests, and no DynamoDB item is written", async () => {
        usePostgres(true);
        const fake = await deployAdmin("https://admin.cloudfront.net");

        expect(addServiceManifestTableItem).not.toHaveBeenCalled();
        expect(fake.invocations()).toHaveLength(1);

        const [invocation] = fake.invocations();
        expect(invocation.name).toBe(SERVICE_MANIFESTS_INVOCATION_NAME);
        expect(await resolve(invocation.config.functionName)).toBe(SCHEMA_SETUP_ARN);
        expect(JSON.parse(await resolve(invocation.config.input))).toEqual({
            WebinySqlSchemaSetup: {
                serviceManifests: [
                    {
                        name: "admin",
                        manifest: {
                            url: "https://admin.cloudfront.net",
                            cloudfront: {
                                distributionId: "E123",
                                domain: "https://admin.cloudfront.net"
                            }
                        }
                    }
                ]
            }
        });
    });

    it("are sent again only when a manifest changes: the input is the manifests, with no other trigger", async () => {
        usePostgres(true);
        const inputOf = async (url: string) => {
            const [invocation] = (await deployAdmin(url)).invocations();
            expect(Object.keys(invocation.config).sort()).toEqual(["functionName", "input"]);
            return resolve(invocation.config.input);
        };

        const first = await inputOf("https://admin.cloudfront.net");
        expect(await inputOf("https://admin.cloudfront.net")).toBe(first);
        expect(await inputOf("https://admin.example.com")).not.toBe(first);
    });

    it("include those an extension adds, in the same invocation", async () => {
        usePostgres(true);
        const fake = createFakeApp();
        const app = withServiceManifest(fake.app);
        app.addHandler(() => app.addServiceManifest(adminManifest("https://admin")));
        await fake.run(programApp => {
            programApp.addHandler(() => {
                programApp.addServiceManifest({ name: "custom", manifest: { key: "value" } });
            });
        });

        expect(fake.invocations()).toHaveLength(1);
        const input = JSON.parse(await resolve(fake.invocations()[0].config.input));
        expect(
            input.WebinySqlSchemaSetup.serviceManifests.map((item: ServiceManifest) => item.name)
        ).toEqual(["admin", "custom"]);
    });

    it("invoke nothing when the app has no manifests", async () => {
        usePostgres(true);
        const fake = createFakeApp();
        withServiceManifest(fake.app);
        await fake.run();

        expect(fake.resources).toEqual([]);
    });

    it("stop the deploy, saying to deploy the api app, when the api has no schema-setup function", () => {
        expect(() =>
            getSchemaSetupFunctionArn("admin", { schemaSetupLambdaArn: undefined })
        ).toThrow(/"admin" app.*yarn webiny deploy api/);
        expect(getSchemaSetupFunctionArn("admin", API_OUTPUT)).toBe(SCHEMA_SETUP_ARN);
    });
});

describe("an app's service manifests without <Infra.Postgres />", () => {
    it("are written as DynamoDB items of the core table, as before, and nothing is invoked", async () => {
        usePostgres(false);
        const fake = createFakeApp();
        const app = withServiceManifest(fake.app);
        const admin = adminManifest("https://admin");
        app.addHandler(() => app.addServiceManifest(admin));
        await fake.run();

        expect(fake.invocations()).toEqual([]);
        expect(addServiceManifestTableItem).toHaveBeenCalledTimes(1);
        const [calledApp, table, manifest] = vi.mocked(addServiceManifestTableItem).mock.calls[0];
        expect(calledApp).toBe(fake.app);
        expect(manifest).toEqual(admin);
        expect(await resolve(table.tableName)).toBe("wby-primary");
        expect(await resolve(table.hashKey)).toBe("PK");
        expect(await resolve(table.rangeKey)).toBe("SK");
    });
});

describe("the core's service manifest", () => {
    const eventBus = {
        output: { arn: pulumi.output("event-bus-arn"), name: pulumi.output("event-bus") }
    };
    const dynamoDbTable = {
        output: {
            arn: pulumi.output("table-arn"),
            name: pulumi.output("wby-primary"),
            hashKey: pulumi.output("PK"),
            rangeKey: pulumi.output<string | undefined>("SK")
        }
    };

    it("has the event bus and the DynamoDB table without Postgres, as before", async () => {
        const manifest = createCoreServiceManifest({ eventBus, dynamoDbTable });
        expect(manifest.name).toBe("core");
        expect(await resolve(manifest.manifest)).toEqual({
            eventBus: { arn: "event-bus-arn", name: "event-bus" },
            dynamodbTable: {
                arn: "table-arn",
                name: "wby-primary",
                hashKey: "PK",
                rangeKey: "SK"
            }
        });
        // Same keys, in the same order, as the DynamoDB item has today.
        expect(Object.keys(manifest.manifest)).toEqual(["eventBus", "dynamodbTable"]);
    });

    it("has only the event bus with Postgres", async () => {
        const manifest = createCoreServiceManifest({ eventBus });
        expect(await resolve(manifest.manifest)).toEqual({
            eventBus: { arn: "event-bus-arn", name: "event-bus" }
        });
    });

    it("goes into the core stack output with Postgres, resolved, for the api deploy", async () => {
        const fake = createFakeApp();
        addServiceManifestsOutput(fake.app, [
            createCoreServiceManifest({ eventBus }),
            { name: "custom", manifest: { key: pulumi.output("value") } }
        ]);

        expect(Object.keys(fake.outputs)).toEqual([CORE_SERVICE_MANIFESTS_OUTPUT]);
        expect(await resolve(fake.outputs[CORE_SERVICE_MANIFESTS_OUTPUT] as never)).toEqual([
            { name: "core", manifest: { eventBus: { arn: "event-bus-arn", name: "event-bus" } } },
            { name: "custom", manifest: { key: "value" } }
        ]);
        expect(fake.resources).toEqual([]);
    });
});

describe("the manifests the api's schema setup stores", () => {
    const core: ServiceManifest = { name: "core", manifest: { eventBus: { arn: "bus" } } };
    const api: ServiceManifest = { name: "api", manifest: { url: "https://api" } };
    const scheduler: ServiceManifest = { name: "scheduler", manifest: { lambdaArn: "fn" } };

    it("are the core's, then the api's own", () => {
        expect(getSchemaSetupServiceManifests([core], [api, scheduler])).toEqual([
            core,
            api,
            scheduler
        ]);
    });

    it("take the api's own on a repeated name", () => {
        const custom = { name: "custom", manifest: { from: "core" } };
        const ownCustom = { name: "custom", manifest: { from: "api" } };
        expect(getSchemaSetupServiceManifests([core, custom], [api, ownCustom])).toEqual([
            core,
            ownCustom,
            api
        ]);
    });

    it("stop the deploy, saying to deploy the core again, when the core output has none", () => {
        expect(() => getSchemaSetupServiceManifests(undefined, [api])).toThrow(
            /yarn webiny deploy core/
        );
    });
});
