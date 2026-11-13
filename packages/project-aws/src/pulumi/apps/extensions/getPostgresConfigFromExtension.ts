import {
    Postgres as postgresExt,
    POSTGRES_DEFAULT_MAX_CAPACITY,
    POSTGRES_DEFAULT_MIN_CAPACITY,
    POSTGRES_DEFAULT_READERS
} from "@webiny/project-extensions-aws/extensions/Postgres.js";
import { type IProjectConfigModel } from "@webiny/project/abstractions/models/index.js";

export interface PostgresExtensionConfig {
    minCapacity: number;
    maxCapacity: number;
    readers: number;
}

/**
 * The `<Infra.Postgres />` settings with their defaults filled in, or `undefined` when the project
 * doesn't use Postgres.
 */
export const getPostgresConfigFromExtension = (
    projectConfig: IProjectConfigModel
): PostgresExtensionConfig | undefined => {
    const [postgresExtension] = projectConfig.extensionsByType(postgresExt);
    if (!postgresExtension) {
        return undefined;
    }

    const params = postgresExtension.params || {};
    return {
        minCapacity: params.minCapacity ?? POSTGRES_DEFAULT_MIN_CAPACITY,
        maxCapacity: params.maxCapacity ?? POSTGRES_DEFAULT_MAX_CAPACITY,
        readers: params.readers ?? POSTGRES_DEFAULT_READERS
    };
};
