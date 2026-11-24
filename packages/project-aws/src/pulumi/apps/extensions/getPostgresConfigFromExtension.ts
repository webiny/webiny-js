import {
    AuroraPostgresCluster,
    POSTGRES_DEFAULT_MAX_CAPACITY,
    POSTGRES_DEFAULT_MIN_CAPACITY,
    POSTGRES_DEFAULT_POOL_SIZE,
    POSTGRES_DEFAULT_READERS
} from "@webiny/project-extensions-aws/extensions/AuroraPostgresCluster.js";
import { type IProjectConfigModel } from "@webiny/project/abstractions/models/index.js";

export interface PostgresExtensionConfig {
    minCapacity: number;
    maxCapacity: number;
    readers: number;
    /** The web function's connection pool size. */
    poolSize: number;
    /** Whether an RDS Proxy sits in front of the database. */
    rdsProxy: boolean;
}

/**
 * The settings of the Aurora cluster `<Infra.AuroraPostgres />` renders, with their defaults filled
 * in, or `undefined` when the project doesn't use Postgres on AWS.
 */
export const getPostgresConfigFromExtension = (
    projectConfig: IProjectConfigModel
): PostgresExtensionConfig | undefined => {
    const [postgresExtension] = projectConfig.extensionsByType(AuroraPostgresCluster);
    if (!postgresExtension) {
        return undefined;
    }

    const params = postgresExtension.params || {};
    return {
        minCapacity: params.minCapacity ?? POSTGRES_DEFAULT_MIN_CAPACITY,
        maxCapacity: params.maxCapacity ?? POSTGRES_DEFAULT_MAX_CAPACITY,
        readers: params.readers ?? POSTGRES_DEFAULT_READERS,
        poolSize: params.poolSize ?? POSTGRES_DEFAULT_POOL_SIZE,
        rdsProxy: params.rdsProxy === true
    };
};
