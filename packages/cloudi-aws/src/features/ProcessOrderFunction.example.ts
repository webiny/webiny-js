/**
 * Example: Process Order SNS Function
 *
 * This example demonstrates how to create a Lambda function that:
 * - Implements the SnsFunction interface
 * - Processes SNS events
 * - Uses dependency injection for services
 * - Uses middleware pattern with next() to handle event routing
 * - Exports using createImplementation from @webiny/di
 */

import { createImplementation } from "@webiny/di";
import {
    SnsFunction,
    type SNSEvent,
    type SnsResult,
    type NextFunction
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
 * Implementation of the ProcessOrder function
 */
export class ProcessOrderFunction implements SnsFunction.Interface {
    constructor(
        private orderService: IOrderService,
        private logger: ILoggerService
    ) {}

    async execute(event: SNSEvent, next: NextFunction): Promise<SnsResult> {
        // Middleware pattern: check if this handler can process the event
        // If not an SNS event, pass to the next handler
        if (!Array.isArray(event.Records) || event.Records[0]?.EventSource !== "aws:sns") {
            return next();
        }

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
export const processOrderFunction = createImplementation({
    abstraction: SnsFunction,
    implementation: ProcessOrderFunction,
    dependencies: [OrderService, LoggerService]
});

/**
 * Example usage in handler file:
 *
 * import { createFunction } from "@cloudi/aws";
 * import { processOrderFunction } from "./features/ProcessOrderFunction.example";
 * import { consoleLogger, dynamoDbOrderService } from "./services";
 *
 * export const handler = createFunction((container) => {
 *   // Register services
 *   container.register(consoleLogger).inSingletonScope();
 *   container.register(dynamoDbOrderService).inSingletonScope();
 *
 *   // Register the function implementation
 *   container.register(processOrderFunction).inSingletonScope();
 * });
 */

