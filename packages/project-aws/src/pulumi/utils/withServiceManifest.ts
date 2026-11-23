import merge from "lodash/merge.js";
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import type { PulumiApp } from "@webiny/pulumi";
import type { ServiceManifest, TableDefinition } from "./addServiceManifestTableItem.js";
import { addServiceManifestTableItem } from "./addServiceManifestTableItem.js";
import { CoreOutput } from "~/pulumi/apps/common/CoreOutput.js";
import { ApiOutput } from "~/pulumi/apps/api/ApiOutput.js";
import { createSchemaSetupEvent } from "~/pulumi/apps/api/ApiSchemaSetup.js";
import { projectUsesPostgres } from "~/pulumi/apps/extensions/projectUsesPostgres.js";

export interface WithServiceManifest {
    addServiceManifest(manifest: ServiceManifest): void;
    /**
     * Every manifest the app publishes, once all are added. Resolves after the app's handlers have
     * run, also those added while handlers run, so a resource can take it as an input from
     * anywhere in the program.
     */
    getServiceManifests(): pulumi.Output<ServiceManifest[]>;
}

interface ApplyManifests {
    (manifests: ServiceManifest[]): void | Promise<void>;
}

/** The name of the invocation that stores an app's manifests through the api's schema setup. */
export const SERVICE_MANIFESTS_INVOCATION_NAME = "service-manifests";

/**
 * Writes each manifest as an item of the core's DynamoDB table, where the API's service discovery
 * reads it from when the project runs on DynamoDB.
 */
export const addServiceManifestTableItems = (app: PulumiApp, manifests: ServiceManifest[]) => {
    if (!manifests.length) {
        return;
    }

    const core = app.getModule(CoreOutput);

    const table: TableDefinition = {
        tableName: core.primaryDynamodbTableName,
        hashKey: core.primaryDynamodbTableHashKey,
        rangeKey: core.primaryDynamodbTableRangeKey
    };

    manifests.forEach(manifest => addServiceManifestTableItem(app, table, manifest));
};

/**
 * The api app's `schema-setup` function, from its stack output. Throws, saying to deploy the api
 * app, when it has none: the api isn't on Postgres yet.
 */
export const getSchemaSetupFunctionArn = (
    appName: string,
    apiOutput: { schemaSetupLambdaArn?: string }
): string => {
    if (!apiOutput.schemaSetupLambdaArn) {
        throw new Error(
            `The api app has no schema-setup function, which the "${appName}" app stores its ` +
                "service manifests with on Postgres. Deploy the api app first: " +
                "`yarn webiny deploy api`."
        );
    }
    return apiOutput.schemaSetupLambdaArn;
};

/**
 * With `<Infra.AuroraPostgres />`: stores the manifests in the database by invoking the api app's
 * `schema-setup` function with them (its ARN is in the api stack output). The database is in the
 * VPC's private subnets, where the deploy can't reach it.
 *
 * The invocation's input is the manifests and nothing else, so it runs on the first deploy and
 * again only when a manifest changes. Pulumi invokes with the deployer's credentials, so the
 * function needs no resource policy for it. The setup upserts only the manifests it's given.
 */
export const invokeSchemaSetupWithManifests = (app: PulumiApp, manifests: ServiceManifest[]) => {
    if (!manifests.length) {
        return;
    }

    const api = app.getModule(ApiOutput);

    return app.addResource(aws.lambda.Invocation, {
        name: SERVICE_MANIFESTS_INVOCATION_NAME,
        config: {
            functionName: api.apply(output => getSchemaSetupFunctionArn(app.name, output)),
            input: pulumi
                .output(manifests)
                .apply(resolved =>
                    JSON.stringify(createSchemaSetupEvent(resolved as ServiceManifest[]))
                )
        }
    });
};

/** Picks where the manifests go: the database with `<Infra.AuroraPostgres />`, else DynamoDB. */
const defaultApplyManifests = async (app: PulumiApp, manifests: ServiceManifest[]) => {
    if (!manifests.length) {
        return;
    }

    if (await projectUsesPostgres()) {
        invokeSchemaSetupWithManifests(app, manifests);
        return;
    }

    addServiceManifestTableItems(app, manifests);
};

/**
 * Augment the given app with `addServiceManifest` functionality.
 *
 * Without `applyManifests`, the app publishes its manifests as DynamoDB items, or, with
 * `<Infra.AuroraPostgres />`, through the api app's schema-setup function.
 * @param {PulumiApp} app
 */
export function withServiceManifest<T extends PulumiApp>(
    app: T,
    applyManifests?: ApplyManifests
): T & WithServiceManifest {
    const manifests: Record<string, ServiceManifest> = {};

    let resolveManifests: (manifests: ServiceManifest[]) => void = () => undefined;
    const finalManifests = pulumi.output(
        new Promise<ServiceManifest[]>(resolve => {
            resolveManifests = resolve;
        })
    );

    function addServiceManifest(manifest: ServiceManifest) {
        manifests[manifest.name] = merge({}, manifests[manifest.name], manifest);
    }

    function getServiceManifests() {
        return finalManifests;
    }

    app.decorateProgram<WithServiceManifest>(async (program, app) => {
        const output = await program({
            ...app,
            addServiceManifest,
            getServiceManifests
        });

        // Runs after every other handler, so it sees the manifests they add. A handler can add more
        // handlers while it runs (an `ApiPulumi` implementation, for one), and the app runs those
        // after this one: when there are any, it queues itself again behind them.
        let queuedAt = 0;
        const collect = async () => {
            if (app.handlers.length > queuedAt) {
                queuedAt = app.handlers.push(collect);
                return;
            }
            const all = Object.values(manifests);
            if (!applyManifests) {
                await defaultApplyManifests(app, all);
            } else {
                await applyManifests(all);
            }
            resolveManifests(all);
        };
        queuedAt = app.handlers.push(collect);

        return output;
    });

    // Augment the original PulumiApp.
    return {
        ...app,
        addServiceManifest,
        getServiceManifests
    };
}
