import { createDynamoDBEventHandler, timerFactory } from "@webiny/handler-aws";
import type { Context } from "~/types.js";
import { OperationsBuilder } from "~/OperationsBuilder.js";
import { executeWithRetry } from "~/executeWithRetry.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";

/**
 * Also, we need to set the maximum running time for the Lambda Function.
 * https://github.com/webiny/webiny-js/blob/f7352d418da2b5ae0b781376be46785aa7ac6ae0/packages/pulumi-aws/src/apps/core/CoreOpenSearch.ts#L232
 * https://github.com/webiny/webiny-js/blob/f7352d418da2b5ae0b781376be46785aa7ac6ae0/packages/pulumi-aws/src/apps/core/CoreElasticSearch.ts#L218
 */
const MAX_RUNNING_TIME = 900;

export const createEventHandler = () => {
    return createDynamoDBEventHandler(async ({ event, context: ctx, lambdaContext }) => {
        const timer = timerFactory(lambdaContext);
        const context = ctx as unknown as Context;
        if (!context.opensearch) {
            console.error("Missing opensearch definition on context.");
            return null;
        }

        const compressor = context.container.resolve(CompressionHandler);

        const builder = new OperationsBuilder({
            compressor
        });

        const operations = await builder.build({
            records: event.Records
        });
        /**
         * No need to do anything if there are no operations.
         */
        if (operations.total === 0) {
            return null;
        }
        /**
         * Execute the operations with retry.
         */
        await executeWithRetry({
            timer,
            maxRunningTime: MAX_RUNNING_TIME,
            context,
            operations
        });

        return null;
    });
};
