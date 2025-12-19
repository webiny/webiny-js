import type {
    S3Event,
    S3EventRecord,
    Context as LambdaContext
} from "@webiny/aws-sdk/types/index.js";
import { CloudFunction } from "../createFunction.js";
import type { Container } from "@webiny/di";
import type { CreateFunctionOptions, FunctionSetup } from "../types.js";

export interface S3Result {
    success: boolean;
    processedRecords?: number;
    message?: string;
}

/**
 * Abstract class for S3 Lambda functions with DI support
 */
export abstract class S3Function extends CloudFunction<S3Event, S3Result> {
    /**
     * Handle the S3 event (processes all records)
     */
    abstract execute(event: S3Event): Promise<S3Result>;

    /**
     * Process a single S3 record (optional, override for record-by-record processing)
     */
    protected async processRecord(record: S3EventRecord): Promise<void> {
        // Override in subclass
    }

    /**
     * Helper method to process all records individually
     */
    protected async processRecords(event: S3Event): Promise<S3Result> {
        let processedCount = 0;

        for (const record of event.Records) {
            try {
                await this.processRecord(record);
                processedCount++;
            } catch (error) {
                console.error(`Failed to process S3 record:`, error);
                throw error;
            }
        }

        return {
            success: true,
            processedRecords: processedCount
        };
    }

    /**
     * Helper method to get bucket name
     */
    protected getBucket(record: S3EventRecord): string {
        return record.s3.bucket.name;
    }

    /**
     * Helper method to get object key
     */
    protected getKey(record: S3EventRecord): string {
        return decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
    }

    /**
     * Helper method to get event name (e.g., ObjectCreated:Put)
     */
    protected getEventName(record: S3EventRecord): string {
        return record.eventName;
    }

    /**
     * Check if event is an object created event
     */
    protected isObjectCreated(record: S3EventRecord): boolean {
        return record.eventName.startsWith("ObjectCreated:");
    }

    /**
     * Check if event is an object removed event
     */
    protected isObjectRemoved(record: S3EventRecord): boolean {
        return record.eventName.startsWith("ObjectRemoved:");
    }
}

/**
 * Factory function to create S3 handlers with DI
 */
export function createS3Function<T extends S3Function>(
    FunctionClass: new (container: Container) => T,
    setup?: FunctionSetup,
    options?: CreateFunctionOptions
) {
    let functionInstance: T | null = null;

    return async (event: S3Event, context: LambdaContext): Promise<S3Result> => {
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

export type { S3Event, S3EventRecord, S3Result };

