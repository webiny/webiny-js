/**
 * Example: Process Order SNS Handler
 *
 * This example demonstrates how to create a Lambda handler that:
 * - Implements the SnsEventHandler interface
 * - Processes SNS events
 * - Uses dependency injection for services
 * - Exports using createImplementation from @webiny/di
 */

import { createImplementation } from "@webiny/di";
import {
    SnsEventHandler,
    type SNSEvent,
    type SnsResult
} from "../index.js";

// Example service interfaces (you would define these in your abstractions)
interface IOrderService {
    processOrder(orderId: string, data: any): Promise<void>;
}

interface ILoggerService {
    info(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
}

// Example abstraction declarations (you would define these in your abstractions)
declare const OrderService: any;
declare const LoggerService: any;

/**
 * Implementation of the ProcessOrder handler
 */
export class ProcessOrderHandler implements SnsEventHandler.Interface {
    constructor(
        private orderService: IOrderService,
        private logger: ILoggerService
    ) {}

    async execute(event: SNSEvent): Promise<SnsResult> {
        this.logger.info("Processing SNS event", {
            recordCount: event.Records.length
        });

        let processedCount = 0;

        try {
            // Process each SNS record
            for (const record of event.Records) {
                const message = JSON.parse(record.Sns.Message);

                this.logger.info("Processing order", {
                    orderId: message.orderId,
                    messageId: record.Sns.MessageId
                });

                await this.orderService.processOrder(message.orderId, message);
                processedCount++;
            }

            return {
                success: true,
                processedRecords: processedCount,
                message: `Successfully processed ${processedCount} orders`
            };
        } catch (error) {
            this.logger.error("Failed to process SNS event", error);

            return {
                success: false,
                processedRecords: processedCount,
                message: error instanceof Error ? error.message : "Unknown error"
            };
        }
    }
}

/**
 * Export the implementation using createImplementation from @webiny/di
 */
export const processOrderHandler = createImplementation({
    abstraction: SnsEventHandler,
    implementation: ProcessOrderHandler,
    dependencies: [OrderService, LoggerService]
});

/**
 * Example usage in handler file:
 *
 * import { createFunction } from "@cloudi/aws";
 * import { processOrderHandler } from "./features/ProcessOrderFunction.example";
 * import { consoleLogger, dynamoDbOrderService } from "./services";
 *
 * export const handler = createFunction((container) => {
 *   // Register services
 *   container.register(consoleLogger).inSingletonScope();
 *   container.register(dynamoDbOrderService).inSingletonScope();
 *
 *   // Register handler - event will be automatically qualified as SNS
 *   container.register(processOrderHandler).inSingletonScope();
 * });
 */

