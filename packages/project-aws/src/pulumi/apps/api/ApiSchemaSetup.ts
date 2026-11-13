import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import type { PulumiApp, PulumiAppModule } from "@webiny/pulumi";
import { createAppModule } from "@webiny/pulumi";
import type { PostgresOutputs } from "~/pulumi/apps/common/CoreOutput.js";
import type { ServiceManifest } from "~/pulumi/utils/addServiceManifestTableItem.js";
import { ApiGraphql } from "./ApiGraphql.js";

/* The event `@webiny/api-event-handler-aws-pg` answers with the schema setup. */
export const SQL_SCHEMA_SETUP_EVENT = "WebinySqlSchemaSetup";

export const ApiSchemaSetupLambdaName = "schema-setup";

/* The CA bundle of the Lambda Node.js runtime, which has the Amazon RDS certificates. */
const LAMBDA_RDS_CA_CERTS = "/var/runtime/ca-cert.pem";

const POSTGRES_DEFAULT_PORT = 5432;

export interface PostgresLambdaEnv {
    WEBINY_PG_HOST: string;
    WEBINY_PG_WRITER_HOST: string;
    WEBINY_PG_PORT: string;
    WEBINY_PG_DATABASE: string;
    WEBINY_PG_USER: string;
    WEBINY_PG_SECRET_ARN: string;
    WEBINY_PG_SSL: string;
    NODE_EXTRA_CA_CERTS: string;
}

const POSTGRES_LAMBDA_ENV_NAMES: Array<keyof PostgresLambdaEnv> = [
    "WEBINY_PG_HOST",
    "WEBINY_PG_WRITER_HOST",
    "WEBINY_PG_PORT",
    "WEBINY_PG_DATABASE",
    "WEBINY_PG_USER",
    "WEBINY_PG_SECRET_ARN",
    "WEBINY_PG_SSL",
    "NODE_EXTRA_CA_CERTS"
];

/**
 * The env vars an API function connects to Postgres with, from the core stack's Postgres outputs.
 * The API goes through the RDS Proxy when the core has one, else to the cluster's writer; the schema
 * setup always goes to the writer (`WEBINY_PG_WRITER_HOST`). Over TLS, verified against the RDS
 * certificates of the Lambda runtime. No password: the functions read it from the secret.
 *
 * Throws when the core stack has no Postgres database, which is the case until `deploy core` runs
 * with `<Infra.Postgres />`.
 */
export const getPostgresLambdaEnv = (pg: PostgresOutputs): PostgresLambdaEnv => {
    const missing = (["pgWriterHost", "pgDatabase", "pgUser", "pgSecretArn"] as const).filter(
        name => !pg[name]
    );
    if (missing.length) {
        throw new Error(
            `The core app has no Postgres database (missing outputs: ${missing.join(", ")}). ` +
                "Deploy the core app with `<Infra.Postgres />` first: `yarn webiny deploy core`."
        );
    }

    return {
        WEBINY_PG_HOST: (pg.pgProxyHost || pg.pgWriterHost) as string,
        WEBINY_PG_WRITER_HOST: pg.pgWriterHost as string,
        WEBINY_PG_PORT: String(pg.pgPort || POSTGRES_DEFAULT_PORT),
        WEBINY_PG_DATABASE: pg.pgDatabase as string,
        WEBINY_PG_USER: pg.pgUser as string,
        WEBINY_PG_SECRET_ARN: pg.pgSecretArn as string,
        WEBINY_PG_SSL: "true",
        NODE_EXTRA_CA_CERTS: LAMBDA_RDS_CA_CERTS
    };
};

/**
 * {@link getPostgresLambdaEnv} for the core stack's output, one Pulumi output per env var, so it can
 * be spread into a function's env next to the other variables.
 */
export const getPostgresLambdaEnvFromCore = (
    core: pulumi.Output<PostgresOutputs>
): Record<keyof PostgresLambdaEnv, pulumi.Output<string>> => {
    const env = core.apply(getPostgresLambdaEnv);
    return Object.fromEntries(
        POSTGRES_LAMBDA_ENV_NAMES.map(name => [name, env.apply(values => values[name])])
    ) as Record<keyof PostgresLambdaEnv, pulumi.Output<string>>;
};

/* Lets the API functions read the database password, and nothing else, from the core's secret. */
export const createPostgresSecretPolicy = (secretArn: string): aws.iam.PolicyDocument => {
    return {
        Version: "2012-10-17",
        Statement: [
            {
                Sid: "PermissionForPostgresSecret",
                Effect: "Allow",
                Action: ["secretsmanager:GetSecretValue"],
                Resource: [secretArn]
            }
        ]
    };
};

/* The event the deploy invokes the schema-setup function with. */
export const createSchemaSetupEvent = (serviceManifests: ServiceManifest[]) => {
    return {
        [SQL_SCHEMA_SETUP_EVENT]: {
            serviceManifests: serviceManifests.map(({ name, manifest }) => ({ name, manifest }))
        }
    };
};

export interface ApiSchemaSetupParams {
    /* The core stack's Postgres outputs. */
    postgres: pulumi.Output<PostgresOutputs>;
    /* Stored in the database by the setup, for service discovery. */
    serviceManifests: ServiceManifest[];
    /* Changes on every deploy, so every deploy runs the setup. Replaced in tests. */
    trigger?: string;
}

export type ApiSchemaSetup = PulumiAppModule<typeof ApiSchemaSetup>;

/**
 * The API on Postgres, at deploy time:
 * - lets the API role read the database password from the core's secret;
 * - adds the `schema-setup` function: the GraphQL function's bundle, role, env and VPC, with time
 *   for the setup and no route to it;
 * - invokes it on every deploy with the `WebinySqlSchemaSetup` event. A failed setup fails the
 *   deploy, so the schema is in place before the after-deploy hooks (AutoInstall) run. With RDS
 *   Proxy the setup also waits until the proxy accepts the API's connections, and fails the deploy
 *   when it doesn't within 10 minutes.
 *
 * The GraphQL function gets the `WEBINY_PG_*` env from `createApiPulumiApp`, before this module
 * copies its config.
 */
export const ApiSchemaSetup = createAppModule({
    name: "ApiSchemaSetup",
    config(app: PulumiApp, params: ApiSchemaSetupParams) {
        const graphql = app.getModule(ApiGraphql);

        const secretPolicy = app.addResource(aws.iam.RolePolicy, {
            name: "api-lambda-pg-secret",
            config: {
                role: graphql.role.output.id,
                policy: params.postgres.apply(pg => {
                    const { WEBINY_PG_SECRET_ARN } = getPostgresLambdaEnv(pg);
                    return JSON.stringify(createPostgresSecretPolicy(WEBINY_PG_SECRET_ARN));
                })
            }
        });

        const baseConfig = graphql.functions.graphql.config.clone();

        const schemaSetup = app.addResource(aws.lambda.Function, {
            name: ApiSchemaSetupLambdaName,
            config: {
                ...baseConfig,
                description: "Sets the Webiny API up on Postgres. Invoked by every deploy.",
                // Lambda's maximum. Creating the tables of a new database takes longer than a request
                // may, and with RDS Proxy the setup then waits (up to 10 minutes) until the proxy
                // accepts the API's connections: a new proxy refuses them for a few minutes.
                timeout: 900,
                loggingConfig: {
                    logFormat: "JSON"
                }
            }
        });

        const invocation = app.addResource(aws.lambda.Invocation, {
            name: ApiSchemaSetupLambdaName,
            config: {
                functionName: schemaSetup.output.name,
                input: pulumi.jsonStringify(createSchemaSetupEvent(params.serviceManifests)),
                triggers: {
                    deploy: params.trigger ?? new Date().toISOString()
                }
            },
            opts: {
                // The function reads the password from the secret as soon as it runs.
                dependsOn: [secretPolicy.output]
            }
        });

        return {
            secretPolicy,
            functions: {
                schemaSetup
            },
            invocation
        };
    }
});
