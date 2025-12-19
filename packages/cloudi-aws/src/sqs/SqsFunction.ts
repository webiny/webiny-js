import type {
    SQSEvent,
    SQSRecord,
    SQSBatchResponse,
    Context as LambdaContext
} from "@webiny/aws-sdk/types/index.js";
import { CloudFunction } from "../createFunction.js";
import type { Container } from "@webiny/di";
import type { CreateFunctionOptions, FunctionSetup } from "../types.js";

export interface SqsResult {
    batchItemFailures?: Array<{ itemIdentifier: string }>;
}

/**
 * Abstract class for SQS Lambda functions with DI support
 */
export abstract class SqsFunction extends CloudFunction<SQSEvent, SqsResult> {
    /**
     * Handle the SQS event (processes all records)
     */
    abstract execute(event: SQSEvent): Promise<SqsResult>;

    /**
     * Process a single SQS record (optional, override for record-by-record processing)
     */
    protected async processRecord(record: SQSRecord): Promise<void> {
        // Override in subclass
    }

    /**
     * Helper method to process all records individually with partial batch failure support
     */
    protected async processRecords(event: SQSEvent): Promise<SqsResult> {
        const failures: Array<{ itemIdentifier: string }> = [];

        for (const record of event.Records) {
            try {
                await this.processRecord(record);
            } catch (error) {
                console.error(`Failed to process record ${record.messageId}:`, error);
                failures.push({ itemIdentifier: record.messageId });
            }
        }

        return {
            batchItemFailures: failures.length > 0 ? failures : undefined
        };
    }

    /**
     * Helper method to parse JSON body
     */
    protected parseBody<T = any>(record: SQSRecord): T {
        return JSON.parse(record.body);
    }

    /**
     * Helper method to get message attributes
     */
    protected getMessageAttributes(record: SQSRecord) {
        return record.messageAttributes || {};
    }
}

/**
 * Factory function to create SQS handlers with DI
 */
export function createSqsFunction<T extends SqsFunction>(
    FunctionClass: new (container: Container) => T,
    setup?: FunctionSetup,
    options?: CreateFunctionOptions
) {
    let functionInstance: T | null = null;

    return async (event: SQSEvent, context: LambdaContext): Promise<SqsResult> => {
        // Initialize on cold start
        if (!functionInstance) {
            const container = new Container();

            // Run user setup
            if (setup) {
                await setup(container);
            }

            // Create function instance
            functionInstance = new FunctionClass(container);
        }

        // Handle the event
        return functionInstance.handle(event);
    };
}

export type { SQSEvent, SQSRecord, SqsResult };

