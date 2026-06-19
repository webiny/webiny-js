import type { Container } from "@webiny/feature/api";
import type { DynamoDBStreamEvent } from "@webiny/aws-sdk/types/index.js";
import {
    DynamoDBEventHandler,
    type DynamoDBResult
} from "@webiny/event-handler-aws/abstractions/handlers/DynamoDBEventHandler.js";
import { RequestContainer } from "@webiny/event-handler-core";
import { timerFactory } from "@webiny/handler-aws/utils/index.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { OperationsBuilder } from "~/OperationsBuilder.js";
import { executeWithRetry } from "~/executeWithRetry.js";

const MAX_RUNNING_TIME = 900;

class DdbToEsLambdaHandlerImpl implements DynamoDBEventHandler.Interface {
    constructor(private container: Container) {}

    async execute(
        eventCtx: EventContext<DynamoDBStreamEvent>,
        _next: NextFunction
    ): Promise<DynamoDBResult> {
        let client: OpenSearchClient.Interface;
        try {
            client = this.container.resolve(OpenSearchClient);
        } catch {
            console.error("Missing OpenSearchClient in container.");
            return { success: false, message: "Missing opensearch client." };
        }

        const compressor = this.container.resolve(CompressionHandler);
        const builder = new OperationsBuilder({ compressor });
        const operations = await builder.build({ records: eventCtx.event.Records });

        if (operations.total === 0) {
            return { success: true, processedRecords: 0 };
        }

        await executeWithRetry({
            timer: timerFactory(),
            maxRunningTime: MAX_RUNNING_TIME,
            openSearchClient: client.use(),
            operations
        });

        return { success: true, processedRecords: operations.total };
    }
}

export const DdbToEsLambdaHandler = DynamoDBEventHandler.createImplementation({
    implementation: DdbToEsLambdaHandlerImpl,
    dependencies: [RequestContainer]
});
