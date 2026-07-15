import type { Container } from "@webiny/feature/api";
import type { DynamoDBStreamEvent } from "@webiny/aws-sdk/types/index.js";
import {
    DynamoDBEventHandler,
    type DynamoDBResult
} from "@webiny/event-handler-aws/abstractions/handlers/DynamoDBEventHandler.js";
import { RequestContainer } from "@webiny/event-handler-core";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import { OperationsBuilder } from "@webiny/api-sync-to-opensearch/features/OperationsBuilder/abstraction.js";
import { ExecuteSyncWithRetry } from "@webiny/api-sync-to-opensearch/features/ExecuteSyncWithRetry/abstraction.js";

const MAX_RUNNING_TIME = 900;

class DdbToOpenSearchHandlerImpl implements DynamoDBEventHandler.Interface {
    constructor(private container: Container) {}

    async execute(
        eventCtx: EventContext<DynamoDBStreamEvent>,
        _next: NextFunction
    ): Promise<DynamoDBResult> {
        const builder = this.container.resolve(OperationsBuilder);
        const operations = await builder.build({ records: eventCtx.event.Records });

        if (operations.total === 0) {
            return { success: true, processedRecords: 0 };
        }

        const executeSyncWithRetry = this.container.resolve(ExecuteSyncWithRetry);

        await executeSyncWithRetry.execute({
            maxRunningTime: MAX_RUNNING_TIME,
            operations
        });

        return { success: true, processedRecords: operations.count };
    }
}

export const DdbToOpenSearchHandler = DynamoDBEventHandler.createImplementation({
    implementation: DdbToOpenSearchHandlerImpl,
    dependencies: [RequestContainer]
});
