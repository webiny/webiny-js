import { Container } from "@webiny/feature/api";
import { TimerFeature } from "@webiny/utils/features/Timer/feature.js";
import { ProcessEnvFeature } from "@webiny/stdlib/node";
import { OperationsBuilder } from "@webiny/api-sync-to-opensearch/features/OperationsBuilder/abstraction.js";
import { ExecuteSyncWithRetry } from "@webiny/api-sync-to-opensearch/features/ExecuteSyncWithRetry/abstraction.js";
import { PgToOpenSearchFeature } from "./features/PgToOpenSearchFeature.js";
import type { Client } from "@webiny/api-opensearch/client.js";
import type { PgWalChangeRecord } from "./types.js";

const MAX_RUNNING_TIME = 900;

export type PgToOpenSearchHandler = (records: PgWalChangeRecord[]) => Promise<void>;

export const createPgToOpenSearchHandler = (client: Client): PgToOpenSearchHandler => {
    const container = new Container();

    ProcessEnvFeature.register(container);
    TimerFeature.register(container, {
        getRemainingSeconds: () => MAX_RUNNING_TIME,
        getRemainingMilliseconds: () => MAX_RUNNING_TIME * 1000
    });

    PgToOpenSearchFeature.register(container, { client });

    const builder = container.resolve(OperationsBuilder);
    const executeSyncWithRetry = container.resolve(ExecuteSyncWithRetry);

    return async (records: PgWalChangeRecord[]): Promise<void> => {
        const operations = await builder.build({ records });

        if (operations.total === 0) {
            return;
        }

        await executeSyncWithRetry.execute({
            maxRunningTime: MAX_RUNNING_TIME,
            operations
        });
    };
};
