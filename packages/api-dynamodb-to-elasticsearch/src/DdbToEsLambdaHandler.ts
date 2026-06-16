import type { Container } from "@webiny/feature/api";
import type { DynamoDBStreamEvent } from "@webiny/aws-sdk/types/index.js";
import {
    DynamoDBEventHandler,
    type DynamoDBResult
} from "@webiny/event-handler-aws/abstractions/handlers/DynamoDBEventHandler.js";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import { RequestContainer } from "@webiny/event-handler-core";
import { timerFactory } from "@webiny/handler-aws/utils/index.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { OperationsBuilder } from "~/OperationsBuilder.js";
import { executeWithRetry } from "~/executeWithRetry.js";
import type { Context } from "~/types.js";

const MAX_RUNNING_TIME = 900;

class DdbToEsLambdaHandlerImpl implements DynamoDBEventHandler.Interface {
    constructor(private container: Container) {}

    async execute(
        eventCtx: EventContext<DynamoDBStreamEvent>,
        _next: NextFunction
    ): Promise<DynamoDBResult> {
        const ctx: Record<string, any> = { container: this.container };
        for (const enhancer of this.container.resolveAll(GraphQLContextEnhancer)) {
            await enhancer.enhance(ctx);
        }

        if (!(ctx as Context).opensearch) {
            console.error("Missing opensearch definition on context.");
            return { success: false, message: "Missing opensearch context." };
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
            context: ctx as Context,
            operations
        });

        return { success: true, processedRecords: operations.total };
    }
}

export const DdbToEsLambdaHandler = DynamoDBEventHandler.createImplementation({
    implementation: DdbToEsLambdaHandlerImpl,
    dependencies: [RequestContainer]
});
