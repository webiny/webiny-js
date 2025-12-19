import type {
    SNSEvent,
    SNSEventRecord,
    Context as LambdaContext
} from "@webiny/aws-sdk/types/index.js";
import { CloudFunction } from "../createFunction.js";
import type { Container } from "@webiny/di";
import type { CreateFunctionOptions, FunctionSetup } from "../types.js";

export interface SnsResult {
    success: boolean;
    processedRecords?: number;
    message?: string;
}

/**
 * Abstract class for SNS Lambda functions with DI support
 */
export abstract class SnsFunction extends CloudFunction<SNSEvent, SnsResult> {
    /**
     * Handle the SNS event (processes all records)
     */
    abstract execute(event: SNSEvent): Promise<SnsResult>;

    /**
     * Process a single SNS record (optional, override for record-by-record processing)
     */
    protected async processRecord(record: SNSEventRecord): Promise<void> {
        // Override in subclass
    }

    /**
     * Helper method to process all records individually
     */
    protected async processRecords(event: SNSEvent): Promise<SnsResult> {
        let processedCount = 0;

        for (const record of event.Records) {
            try {
                await this.processRecord(record);
                processedCount++;
            } catch (error) {
                console.error(`Failed to process SNS record:`, error);
                throw error;
            }
        }

        return {
            success: true,
            processedRecords: processedCount
        };
    }

    /**
     * Helper method to parse JSON message
     */
    protected parseMessage<T = any>(record: SNSEventRecord): T {
        return JSON.parse(record.Sns.Message);
    }

    /**
     * Helper method to get message
     */
    protected getMessage(record: SNSEventRecord): string {
        return record.Sns.Message;
    }

    /**
     * Helper method to get subject
     */
    protected getSubject(record: SNSEventRecord): string | undefined {
        return record.Sns.Subject;
    }

    /**
     * Helper method to get topic ARN
     */
    protected getTopicArn(record: SNSEventRecord): string {
        return record.Sns.TopicArn;
    }

    /**
     * Helper method to get message attributes
     */
    protected getMessageAttributes(record: SNSEventRecord) {
        return record.Sns.MessageAttributes || {};
    }
}

/**
 * Factory function to create SNS handlers with DI
 */
export function createSnsFunction<T extends SnsFunction>(
    FunctionClass: new (container: Container) => T,
    setup?: FunctionSetup,
    options?: CreateFunctionOptions
) {
    let functionInstance: T | null = null;

    return async (event: SNSEvent, context: LambdaContext): Promise<SnsResult> => {
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

export type { SNSEvent, SNSEventRecord, SnsResult };

