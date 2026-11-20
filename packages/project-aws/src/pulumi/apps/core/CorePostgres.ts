import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import {
    createAppModule,
    type PulumiApp,
    type PulumiAppModule,
    type PulumiAppResource
} from "@webiny/pulumi";

export type CorePostgres = PulumiAppModule<typeof CorePostgres>;

export const POSTGRES_DATABASE = "webiny";
export const POSTGRES_USER = "webiny";
export const POSTGRES_PORT = 5432;

/* Aurora PostgreSQL's major version, and its cluster parameter group family. */
const ENGINE = "aurora-postgresql";
const ENGINE_MAJOR_VERSION = "17";
const PARAMETER_GROUP_FAMILY = "aurora-postgresql17";

export interface PostgresNetwork {
    subnetIds: pulumi.Input<pulumi.Input<string>[]>;
    securityGroupIds: pulumi.Input<pulumi.Input<string>[]>;
}

export interface CorePostgresParams {
    minCapacity: number;
    maxCapacity: number;
    readers: number;
    rdsProxy: boolean;
    network: PostgresNetwork;
    /* On in production: deletion protection, a week of backups and a final snapshot. */
    protect: boolean;
    /*
     * The engine version a new cluster gets: the latest 17.x. Replaced in tests, where there is no
     * AWS to ask.
     */
    getEngineVersion?: () => pulumi.Input<string>;
}

const getLatestEngineVersion = () => {
    return pulumi.output(
        aws.rds.getEngineVersion({ engine: ENGINE, version: ENGINE_MAJOR_VERSION, latest: true })
    ).versionActual;
};

const assumeRolePolicy = (service: string) =>
    JSON.stringify({
        Version: "2012-10-17",
        Statement: [{ Effect: "Allow", Principal: { Service: service }, Action: "sts:AssumeRole" }]
    });

/**
 * The Postgres database of a project with `<Infra.Postgres />`: an Aurora PostgreSQL 17 Serverless
 * v2 cluster with a writer and `readers` reader instances, and its credentials in a Secrets Manager
 * secret (`{ username, password }`). With `rdsProxy`, an RDS Proxy in front of it, which reads the
 * same secret.
 *
 * The cluster, its instances and the proxy go into `network`: the private subnets of the VPC the
 * core app creates and its default security group, which the API functions use too, or the
 * `postgresVpcConfig` of an existing VPC.
 *
 * No password leaves this module: the API reads it from the secret.
 */
export const CorePostgres = createAppModule({
    name: "CorePostgres",
    config(app: PulumiApp, params: CorePostgresParams) {
        const { network, protect } = params;
        const getEngineVersion = params.getEngineVersion ?? getLatestEngineVersion;

        const password = app.addResource(random.RandomPassword, {
            name: "pg-db-password",
            config: { length: 32, special: false }
        });

        const secret = app.addResource(aws.secretsmanager.Secret, {
            name: "pg-db",
            config: {
                description: "Credentials of the Webiny Postgres database.",
                // Outside production, a destroyed project can be deployed again at once.
                recoveryWindowInDays: protect ? 7 : 0
            },
            opts: { protect }
        });

        app.addResource(aws.secretsmanager.SecretVersion, {
            name: "pg-db",
            config: {
                secretId: secret.output.id,
                secretString: pulumi
                    .all([password.output.result])
                    .apply(([value]) =>
                        JSON.stringify({ username: POSTGRES_USER, password: value })
                    )
            }
        });

        const subnetGroup = app.addResource(aws.rds.SubnetGroup, {
            name: "pg-db",
            config: {
                description: "Subnets of the Webiny Postgres database.",
                subnetIds: network.subnetIds
            }
        });

        /*
         * The server notices a client that went away without closing its connection (a Lambda
         * environment that was recycled) within about two minutes, and frees the connection.
         */
        const parameterGroup = app.addResource(aws.rds.ClusterParameterGroup, {
            name: "pg-db",
            config: {
                family: PARAMETER_GROUP_FAMILY,
                description: "Webiny Postgres database: TCP keepalives.",
                parameters: [
                    { name: "tcp_keepalives_idle", value: "60" },
                    { name: "tcp_keepalives_interval", value: "10" },
                    { name: "tcp_keepalives_count", value: "6" }
                ]
            }
        });

        // A final snapshot needs a name that no earlier snapshot of the account has.
        const finalSnapshotSuffix = protect
            ? app.addResource(random.RandomId, {
                  name: "pg-db-final-snapshot",
                  config: { byteLength: 4 }
              })
            : null;

        const cluster = app.addResource(aws.rds.Cluster, {
            name: "pg-db",
            config: {
                engine: ENGINE,
                engineMode: "provisioned",
                engineVersion: getEngineVersion(),
                databaseName: POSTGRES_DATABASE,
                masterUsername: POSTGRES_USER,
                masterPassword: password.output.result,
                port: POSTGRES_PORT,
                storageType: "aurora",
                storageEncrypted: true,
                dbSubnetGroupName: subnetGroup.output.name,
                dbClusterParameterGroupName: parameterGroup.output.name,
                vpcSecurityGroupIds: network.securityGroupIds,
                serverlessv2ScalingConfiguration: {
                    minCapacity: params.minCapacity,
                    maxCapacity: params.maxCapacity
                },
                enabledCloudwatchLogsExports: ["postgresql"],
                copyTagsToSnapshot: true,
                deletionProtection: protect,
                backupRetentionPeriod: protect ? 7 : 1,
                skipFinalSnapshot: !protect,
                finalSnapshotIdentifier: finalSnapshotSuffix
                    ? pulumi.interpolate`webiny-pg-final-${finalSnapshotSuffix.output.hex}`
                    : undefined,
                // Capacity changes apply now, not in the next maintenance window.
                applyImmediately: true
            },
            opts: {
                protect,
                // The version is picked when the cluster is created; AWS applies minor upgrades.
                // A newer 17.x must not make a later deploy upgrade the cluster.
                ignoreChanges: ["engineVersion"]
            }
        });

        const instances = [];
        for (let index = 0; index <= params.readers; index++) {
            const isWriter = index === 0;
            instances.push(
                app.addResource(aws.rds.ClusterInstance, {
                    name: isWriter ? "pg-db-writer" : `pg-db-reader-${index}`,
                    config: {
                        clusterIdentifier: cluster.output.id,
                        instanceClass: "db.serverless",
                        engine: ENGINE,
                        engineVersion: cluster.output.engineVersion,
                        publiclyAccessible: false,
                        performanceInsightsEnabled: true,
                        // Readers in tier 0–1 scale with the writer, so a failover lands on a warm one.
                        promotionTier: isWriter ? 0 : 1,
                        applyImmediately: true
                    },
                    opts: { ignoreChanges: ["engineVersion"] }
                })
            );
        }

        let proxy: ReturnType<typeof addProxy> | null = null;
        if (params.rdsProxy) {
            proxy = addProxy(app, { secret, cluster, instances, network });
        }

        return {
            cluster,
            instances,
            secret,
            subnetGroup,
            parameterGroup,
            proxy: proxy?.proxy ?? null,
            outputs: {
                pgWriterHost: cluster.output.endpoint,
                pgReaderHost: cluster.output.readerEndpoint,
                ...(proxy ? { pgProxyHost: proxy.proxy.output.endpoint } : {}),
                pgPort: POSTGRES_PORT,
                pgDatabase: POSTGRES_DATABASE,
                pgUser: POSTGRES_USER,
                pgSecretArn: secret.output.arn
            }
        };
    }
});

interface AddProxyParams {
    secret: PulumiAppResource<typeof aws.secretsmanager.Secret>;
    cluster: PulumiAppResource<typeof aws.rds.Cluster>;
    instances: PulumiAppResource<typeof aws.rds.ClusterInstance>[];
    network: PostgresNetwork;
}

function addProxy(app: PulumiApp, params: AddProxyParams) {
    const { secret, cluster, instances, network } = params;

    const role = app.addResource(aws.iam.Role, {
        name: "pg-proxy",
        config: { assumeRolePolicy: assumeRolePolicy("rds.amazonaws.com") }
    });

    app.addResource(aws.iam.RolePolicy, {
        name: "pg-proxy",
        config: {
            role: role.output.id,
            policy: pulumi.all([secret.output.arn]).apply(([arn]) =>
                JSON.stringify({
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Effect: "Allow",
                            Action: ["secretsmanager:GetSecretValue"],
                            Resource: [arn]
                        }
                    ]
                })
            )
        }
    });

    const proxy = app.addResource(aws.rds.Proxy, {
        name: "pg-proxy",
        config: {
            engineFamily: "POSTGRESQL",
            auths: [{ authScheme: "SECRETS", iamAuth: "DISABLED", secretArn: secret.output.arn }],
            roleArn: role.output.arn,
            vpcSubnetIds: network.subnetIds,
            vpcSecurityGroupIds: network.securityGroupIds,
            requireTls: true,
            idleClientTimeout: 900,
            debugLogging: false
        }
    });

    const targetGroup = app.addResource(aws.rds.ProxyDefaultTargetGroup, {
        name: "pg-proxy",
        config: {
            dbProxyName: proxy.output.name,
            connectionPoolConfig: {
                maxConnectionsPercent: 70,
                maxIdleConnectionsPercent: 50,
                connectionBorrowTimeout: 10
            }
        }
    });

    app.addResource(aws.rds.ProxyTarget, {
        name: "pg-proxy",
        config: {
            dbProxyName: proxy.output.name,
            targetGroupName: targetGroup.output.name,
            dbClusterIdentifier: cluster.output.id
        },
        // The proxy can only register a cluster whose instances are available.
        opts: { dependsOn: instances.map(instance => instance.output) }
    });

    return { role, proxy, targetGroup };
}
