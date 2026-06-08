/**
 * Example: Process Order SNS Handler
 */

import { Abstraction } from "@webiny/di";
import { SnsEventHandler, type SNSEvent, type SnsResult } from "../index.js";
import type { NextFunction, EventContext } from "@webiny/event-handler";

interface IOrderService {
    processOrder(orderId: string, data: any): Promise<void>;
}

interface ILoggerService {
    info(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
}

declare const OrderService: Abstraction<IOrderService>;
declare const LoggerService: Abstraction<ILoggerService>;

class ProcessOrderHandler implements SnsEventHandler.Interface {
    constructor(
        private orderService: IOrderService,
        private logger: ILoggerService
    ) {}

    async execute(ctx: EventContext<SNSEvent>, next: NextFunction): Promise<SnsResult> {
        if (!Array.isArray(ctx.event.Records) || ctx.event.Records[0]?.EventSource !== "aws:sns") {
            return next();
        }

        this.logger.info("Processing SNS event", { recordCount: ctx.event.Records.length });
        let processed = 0;

        try {
            for (const record of ctx.event.Records) {
                const message = JSON.parse(record.Sns.Message);
                await this.orderService.processOrder(message.orderId, message);
                processed++;
            }
            return { success: true, processedRecords: processed };
        } catch (error) {
            this.logger.error("Failed to process SNS event", error);
            return {
                success: false,
                processedRecords: processed,
                message: error instanceof Error ? error.message : "Unknown error"
            };
        }
    }
}

export const processOrderHandler = SnsEventHandler.createImplementation({
    implementation: ProcessOrderHandler,
    dependencies: [OrderService, LoggerService]
});

/**
 * Usage:
 *
 * export const handler = createEventHandler(async (container) => {
 *   container.register(consoleLogger).inSingletonScope();
 *   container.register(dynamoDbOrderService).inSingletonScope();
 *   container.register(processOrderHandler).inSingletonScope();
 * });
 */
