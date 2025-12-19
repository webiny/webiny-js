/**
 * Example: Process Order SNS Function
 *
 * This example demonstrates how to create a Lambda function that:
 * - Implements the SnsFunction interface
 * - Processes SNS events
 * - Uses dependency injection for services
 */

import type { SNSEvent, ISnsFunction, SnsResult } from "../abstractions/index.js";

// Example service interfaces (you would define these in your abstractions)
interface IOrderService {
    processOrder(orderId: string, data: any): Promise<void>;
}

interface ILoggerService {
    info(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
}

/**
 * Implementation of the ProcessOrder function
 */
export class ProcessOrderFunction implements ISnsFunction {
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
 * Example usage in handler file:
 *
 * import { createFunction, SnsFunction } from "@cloudi/aws";
 * import { ProcessOrderFunction } from "./features/ProcessOrderFunction.example";
 * import { OrderService, LoggerService } from "~/abstractions";
 * import { DynamoDBOrderService } from "~/services/DynamoDBOrderService";
 * import { ConsoleLogger } from "~/services/ConsoleLogger";
 *
 * export const handler = createFunction(
 *   SnsFunction,
 *   async (container) => {
 *     // Register services
 *     container.bind(LoggerService).to(ConsoleLogger);
 *     container.bind(OrderService).to(DynamoDBOrderService);
 *
 *     // Register the function implementation
 *     container.bind(SnsFunction).to(ProcessOrderFunction);
 *   }
 * );
 */

