import * as pulumi from "@pulumi/pulumi";
import type { PulumiApp } from "@webiny/pulumi";
import type { ServiceManifest } from "~/pulumi/utils/addServiceManifestTableItem.js";

/** The core stack output that carries the core's service manifests, with `<Infra.Postgres />`. */
export const CORE_SERVICE_MANIFESTS_OUTPUT = "serviceManifests";

export interface CoreServiceManifestParams {
    eventBus: {
        output: { arn: pulumi.Output<string>; name: pulumi.Output<string> };
    };
    /* The primary DynamoDB table. Not in the manifest with `<Infra.Postgres />`. */
    dynamoDbTable?: {
        output: {
            arn: pulumi.Output<string>;
            name: pulumi.Output<string>;
            hashKey: pulumi.Output<string>;
            rangeKey: pulumi.Output<string | undefined>;
        };
    };
}

/** The `core` service manifest: the event bus, and the primary DynamoDB table when there is one. */
export const createCoreServiceManifest = (params: CoreServiceManifestParams): ServiceManifest => {
    const { eventBus, dynamoDbTable } = params;
    return {
        name: "core",
        manifest: {
            eventBus: {
                arn: eventBus.output.arn,
                name: eventBus.output.name
            },
            ...(dynamoDbTable && {
                dynamodbTable: {
                    arn: dynamoDbTable.output.arn,
                    name: dynamoDbTable.output.name,
                    hashKey: dynamoDbTable.output.hashKey,
                    rangeKey: dynamoDbTable.output.rangeKey
                }
            })
        }
    };
};

/**
 * With `<Infra.Postgres />`: puts the core's service manifests in its stack output. The core deploys
 * before the api's schema-setup function exists, and the database is in private subnets the deploy
 * can't reach, so the api deploy passes them on to the schema setup, which stores them.
 */
export const addServiceManifestsOutput = (app: PulumiApp, manifests: ServiceManifest[]) => {
    app.addOutput(
        CORE_SERVICE_MANIFESTS_OUTPUT,
        pulumi.output(manifests.map(({ name, manifest }) => ({ name, manifest })))
    );
};
