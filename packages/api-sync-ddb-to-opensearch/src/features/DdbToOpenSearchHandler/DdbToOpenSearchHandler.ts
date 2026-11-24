import type { Container } from "@webiny/feature/api";
import type { DynamoDBStreamEvent } from "@webiny/aws-sdk/types/index.js";
import {
    DynamoDBInputHandler,
    type DynamoDBResult
} from "@webiny/api-kernel-aws/abstractions/handlers/DynamoDBInputHandler.js";
import { RequestContainer } from "@webiny/api-kernel-core";
import type { InputContext, NextFunction } from "@webiny/api-kernel-core";
import { OperationsBuilder } from "@webiny/api-sync-to-opensearch/features/OperationsBuilder/abstraction.js";
import { ExecuteSyncWithRetry } from "@webiny/api-sync-to-opensearch/features/ExecuteSyncWithRetry/abstraction.js";

const MAX_RUNNING_TIME = 900;

class DdbToOpenSearchHandlerImpl implements DynamoDBInputHandler.Interface {
    constructor(private container: Container) {}

    async execute(
        inputCtx: InputContext<DynamoDBStreamEvent>,
        _next: NextFunction
    ): Promise<DynamoDBResult> {
        const builder = this.container.resolve(OperationsBuilder);
        const operations = await builder.build({ records: inputCtx.input.Records });

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

export const DdbToOpenSearchHandler = DynamoDBInputHandler.createImplementation({
    implementation: DdbToOpenSearchHandlerImpl,
    dependencies: [RequestContainer]
});
