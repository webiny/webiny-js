import { Abstraction } from "@webiny/di-container";

type Env = {
    apiUrl: string;
    debug: boolean;
    deploymentId: string;
    graphqlApiUrl: string;
    telemetryEnabled: boolean;
    telemetryUserId: string | undefined;
    trashBinRetentionPeriodDays: number;
    wcpProjectId: string | undefined;
    webinyVersion: string;
    websocketUrl: string;
    graphqlClient?: {
        retries: {
            maxRetries: number;
            delayInMillis: number;
        };
    };
};

export interface IEnvConfig {
    get<K extends keyof Env>(key: K, defaultValue?: Env[K]): Env[K];
}

export const EnvConfig = new Abstraction<IEnvConfig>("EnvConfig");

export namespace EnvConfig {
    export type Interface = IEnvConfig;
    export type Config = Env;
}
